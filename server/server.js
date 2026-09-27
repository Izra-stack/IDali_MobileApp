import fs from "node:fs";
import http from "node:http";
import path from "node:path";

function autoLoadEnv() {
  const candidates = [
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "server", ".env"),
    path.join(process.cwd(), "..", ".env"),
  ];
  for (const envPath of candidates) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
            const [key, ...valueParts] = trimmed.split("=");
            const k = key.trim();
            const v = valueParts
              .join("=")
              .trim()
              .replace(/^["']|["']$/g, "");
            if (k && !process.env[k]) {
              process.env[k] = v;
            }
          }
        }
      }
    } catch {}
  }
}
autoLoadEnv();

const PORT = Number(process.env.PORT || 3000);
const MAX_IMAGE_BYTES = 22 * 1024 * 1024;
const MAX_REQUEST_BYTES = Math.ceil(MAX_IMAGE_BYTES * 1.4);
const PROVIDER_TIMEOUT_MS = 45_000;
const MAGIC_HOUR_POLL_INTERVAL_MS = 1_000;
const MAGIC_HOUR_MAX_WAIT_MS = 120_000;
const DEFAULT_ERROR_MESSAGE =
  "We couldn't remove the background right now. Please try again in a moment.";

class ProviderError extends Error {
  constructor(provider, message, { status, retryable = true } = {}) {
    super(message);
    this.name = "ProviderError";
    this.provider = provider;
    this.status = status;
    this.retryable = retryable;
  }
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function getExtension(fileName) {
  const extension = String(fileName || "photo.jpg")
    .split(".")
    .pop()
    ?.toLowerCase();
  return ["png", "jpg", "jpeg", "webp", "heic", "heif"].includes(extension)
    ? extension
    : "jpg";
}

function getSafeMimeType(mimeType, fileName) {
  const normalized = String(mimeType || "").toLowerCase();
  if (
    [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/heic",
      "image/heif",
    ].includes(normalized)
  ) {
    return normalized;
  }
  return getExtension(fileName) === "png" ? "image/png" : "image/jpeg";
}

function getApiKey(name) {
  const value = process.env[name]?.trim();
  if (
    !value ||
    value.startsWith("replace-with-") ||
    value.startsWith("your-") ||
    value.includes("YOUR_")
  ) {
    return null;
  }
  return value;
}

async function fetchWithTimeout(
  url,
  options = {},
  timeoutMs = PROVIDER_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Network request failed";
    throw new ProviderError("network", message, { retryable: true });
  } finally {
    clearTimeout(timer);
  }
}

async function readProviderError(response) {
  try {
    const body = await response.text();
    return body.slice(0, 1000);
  } catch {
    return "";
  }
}

function shouldFallbackFromRemoveBg(status, message = "") {
  if (!status || status >= 500) return true;
  if (status === 429) return true;
  if ([401, 402, 403].includes(status)) return true;
  if (status === 400) {
    return /(quota|credit|limit|insufficient|balance|monthly)/i.test(message);
  }
  return true;
}

async function removeWithRemoveBg({ imageBuffer, mimeType, fileName }) {
  const apiKey = getApiKey("REMOVE_BG_API_KEY");
  if (!apiKey) {
    throw new ProviderError("remove.bg", "remove.bg is not configured", {
      retryable: true,
    });
  }

  const form = new FormData();
  form.append(
    "image_file",
    new Blob([imageBuffer], { type: mimeType }),
    fileName,
  );
  form.append("size", "auto");
  form.append("format", "png");

  let response;
  try {
    response = await fetchWithTimeout("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: form,
    });
  } catch (error) {
    throw new ProviderError("remove.bg", error.message, { retryable: true });
  }

  if (!response.ok) {
    const message = await readProviderError(response);
    throw new ProviderError("remove.bg", message || `HTTP ${response.status}`, {
      status: response.status,
      retryable: shouldFallbackFromRemoveBg(response.status, message),
    });
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("image/")) {
    throw new ProviderError("remove.bg", "Provider returned an invalid image", {
      retryable: true,
    });
  }
  return Buffer.from(await response.arrayBuffer());
}

function magicHourUrl(path) {
  return `https://api.magichour.ai${path}`;
}

function magicHourHeaders(apiKey, includeJson = false) {
  return {
    Authorization: `Bearer ${apiKey}`,
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
  };
}

async function readJsonResponse(response, provider) {
  if (!response.ok) {
    const message = await readProviderError(response);
    throw new ProviderError(provider, message || `HTTP ${response.status}`, {
      status: response.status,
      retryable: response.status === 429 || response.status >= 500,
    });
  }
  try {
    return await response.json();
  } catch {
    throw new ProviderError(provider, "Provider returned invalid JSON", {
      retryable: true,
    });
  }
}

async function uploadToMagicHour({ apiKey, imageBuffer, mimeType, fileName }) {
  const uploadUrlsResponse = await fetchWithTimeout(
    magicHourUrl("/v1/files/upload-urls"),
    {
      method: "POST",
      headers: magicHourHeaders(apiKey, true),
      body: JSON.stringify({
        items: [{ type: "image", extension: getExtension(fileName) }],
      }),
    },
  );
  const uploadUrls = await readJsonResponse(uploadUrlsResponse, "Magic Hour");
  const upload = uploadUrls?.items?.[0];
  if (!upload?.upload_url || !upload?.file_path) {
    throw new ProviderError("Magic Hour", "Provider returned no upload URL", {
      retryable: true,
    });
  }

  const uploadResponse = await fetchWithTimeout(upload.upload_url, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: imageBuffer,
  });
  if (!uploadResponse.ok) {
    const message = await readProviderError(uploadResponse);
    throw new ProviderError(
      "Magic Hour",
      message || `HTTP ${uploadResponse.status}`,
      {
        status: uploadResponse.status,
        retryable:
          uploadResponse.status === 429 || uploadResponse.status >= 500,
      },
    );
  }
  return upload.file_path;
}

async function removeWithMagicHour({ imageBuffer, mimeType, fileName }) {
  const apiKey = getApiKey("MAGIC_HOUR_API_KEY");
  if (!apiKey) {
    throw new ProviderError("Magic Hour", "Magic Hour is not configured", {
      retryable: false,
    });
  }

  const filePath = await uploadToMagicHour({
    apiKey,
    imageBuffer,
    mimeType,
    fileName,
  });

  const createResponse = await fetchWithTimeout(
    magicHourUrl("/v1/image-background-remover"),
    {
      method: "POST",
      headers: magicHourHeaders(apiKey, true),
      body: JSON.stringify({
        assets: { image_file_path: filePath },
        name: "IDali background removal",
      }),
    },
  );
  const project = await readJsonResponse(createResponse, "Magic Hour");
  if (!project?.id) {
    throw new ProviderError("Magic Hour", "Provider returned no project ID", {
      retryable: true,
    });
  }

  const deadline = Date.now() + MAGIC_HOUR_MAX_WAIT_MS;
  while (Date.now() < deadline) {
    await sleep(MAGIC_HOUR_POLL_INTERVAL_MS);
    const statusResponse = await fetchWithTimeout(
      magicHourUrl(`/v1/image-projects/${encodeURIComponent(project.id)}`),
      { headers: magicHourHeaders(apiKey) },
    );
    const status = await readJsonResponse(statusResponse, "Magic Hour");
    if (status?.status === "complete") {
      const outputUrl = status.downloads?.[0]?.url;
      if (!outputUrl) {
        throw new ProviderError("Magic Hour", "Provider returned no output", {
          retryable: true,
        });
      }
      const outputResponse = await fetchWithTimeout(outputUrl);
      if (!outputResponse.ok) {
        throw new ProviderError(
          "Magic Hour",
          "Could not download provider output",
          {
            status: outputResponse.status,
            retryable:
              outputResponse.status >= 500 || outputResponse.status === 429,
          },
        );
      }
      return Buffer.from(await outputResponse.arrayBuffer());
    }
    if (["error", "canceled", "cancelled"].includes(status?.status)) {
      throw new ProviderError(
        "Magic Hour",
        "Background removal did not complete",
        {
          retryable: true,
        },
      );
    }
  }

  throw new ProviderError("Magic Hour", "Provider timed out", {
    retryable: true,
  });
}

function sendJson(response, statusCode, body) {
  const payload = JSON.stringify(body);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(payload),
  });
  response.end(payload);
}

function sendPng(response, imageBuffer, provider) {
  response.writeHead(200, {
    "Content-Type": "image/png",
    "Cache-Control": "no-store",
    "X-IDali-Provider": provider,
    "Content-Length": imageBuffer.length,
  });
  response.end(imageBuffer);
}

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
}

async function readJsonBody(request) {
  const chunks = [];
  let received = 0;
  for await (const chunk of request) {
    received += chunk.length;
    if (received > MAX_REQUEST_BYTES) {
      throw new Error("Request too large");
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("Invalid JSON request");
  }
}

function decodeImageRequest(body) {
  if (
    !body ||
    typeof body.imageBase64 !== "string" ||
    !body.imageBase64 ||
    body.imageBase64.length > Math.ceil(MAX_IMAGE_BYTES * 1.4)
  ) {
    throw new Error("Invalid image payload");
  }

  const imageBuffer = Buffer.from(body.imageBase64, "base64");
  if (!imageBuffer.length || imageBuffer.length > MAX_IMAGE_BYTES) {
    throw new Error("Invalid image payload");
  }

  return {
    imageBuffer,
    fileName: String(body.fileName || "idali-photo.jpg").replace(
      /[^a-zA-Z0-9._-]/g,
      "-",
    ),
    mimeType: getSafeMimeType(body.mimeType, body.fileName),
  };
}

async function handleRemoveBackground(request, response) {
  let image;
  try {
    image = decodeImageRequest(await readJsonBody(request));
  } catch (error) {
    sendJson(response, 400, { message: error.message });
    return;
  }

  try {
    const output = await removeWithRemoveBg(image);
    sendPng(response, output, "remove.bg");
    return;
  } catch (error) {
    console.warn("remove.bg failed; trying Magic Hour", {
      message: error.message,
      status: error.status,
      retryable: error.retryable,
    });
  }

  try {
    const output = await removeWithMagicHour(image);
    sendPng(response, output, "Magic Hour");
  } catch (error) {
    console.error("Both background-removal providers failed", {
      status: error.status,
      retryable: error.retryable,
    });
    sendJson(response, 503, { message: DEFAULT_ERROR_MESSAGE });
  }
}

const server = http.createServer(async (request, response) => {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method === "GET" && request.url === "/health") {
    sendJson(response, 200, { status: "ok" });
    return;
  }

  if (request.method === "POST" && request.url === "/api/remove-background") {
    await handleRemoveBackground(request, response);
    return;
  }

  sendJson(response, 404, { message: "Not found" });
});

const isDirectRun =
  process.argv[1]?.endsWith("/server.js") ||
  process.argv[1]?.endsWith("\\server.js");

if (isDirectRun) {
  const missingProviderKeys = [
    "REMOVE_BG_API_KEY",
    "MAGIC_HOUR_API_KEY",
  ].filter((name) => !getApiKey(name));
  if (missingProviderKeys.length) {
    console.warn(
      `Missing backend environment variables: ${missingProviderKeys.join(", ")}`,
    );
  }
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`IDali background-removal server listening on port ${PORT}`);
  });
}

export {
  decodeImageRequest,
  DEFAULT_ERROR_MESSAGE,
  ProviderError,
  server,
  shouldFallbackFromRemoveBg
};

