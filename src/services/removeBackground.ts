import Constants from "expo-constants";
import { File, Paths } from "expo-file-system";

const DEFAULT_ERROR_MESSAGE =
  "We couldn't remove the background right now. Please try again in a moment.";

function getUploadMetadata(imageUri: string) {
  const extension = imageUri.split("?")[0].split(".").pop()?.toLowerCase();
  if (extension === "png")
    return { type: "image/png", name: "idali-photo.png" };
  if (extension === "webp")
    return { type: "image/webp", name: "idali-photo.webp" };
  return { type: "image/jpeg", name: "idali-photo.jpg" };
}

function getApiKey(name: string): string | null {
  const value =
    process.env[name]?.trim() || process.env[`EXPO_PUBLIC_${name}`]?.trim();
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

function getBackgroundRemovalApiUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_IDALI_API_URL?.trim();
  if (configuredUrl) {
    return `${configuredUrl.replace(/\/$/, "")}/api/remove-background`;
  }

  // Derive computer's local network IP dynamically from Expo Metro host
  const hostUri = Constants.expoConfig?.hostUri || Constants.hostUri;
  if (hostUri) {
    const ip = hostUri.split(":")[0];
    if (ip) {
      return `http://${ip}:3000/api/remove-background`;
    }
  }

  return "http://localhost:3000/api/remove-background";
}

async function removeWithRemoveBgDirect(
  base64Data: string,
  apiKey: string,
): Promise<string> {
  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify({
      image_file_b64: base64Data,
      size: "auto",
      format: "png",
    }),
  });

  if (!response.ok) {
    throw new Error(`remove.bg failed with status ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("image/")) {
    throw new Error("Invalid image response from remove.bg");
  }

  const output = new File(
    Paths.cache,
    `idali-background-removed-${Date.now()}.png`,
  );
  output.write(new Uint8Array(await response.arrayBuffer()));
  return output.uri;
}

async function removeWithMagicHourDirect(
  imageUri: string,
  mimeType: string,
  fileName: string,
  apiKey: string,
): Promise<string> {
  const ext = fileName.endsWith(".png") ? "png" : "jpg";
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  const uploadRes = await fetch(
    "https://api.magichour.ai/v1/files/upload-urls",
    {
      method: "POST",
      headers,
      body: JSON.stringify({ items: [{ type: "image", extension: ext }] }),
    },
  );
  if (!uploadRes.ok) throw new Error("Magic Hour upload URL failed");
  const uploadData = await uploadRes.json();
  const upload = uploadData?.items?.[0];
  if (!upload?.upload_url || !upload?.file_path) {
    throw new Error("Magic Hour upload info missing");
  }

  const fileObj = new File(imageUri);
  const base64Str = await fileObj.base64();
  const binaryString = atob(base64Str);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const putRes = await fetch(upload.upload_url, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: bytes,
  });
  if (!putRes.ok) throw new Error("Magic Hour binary upload failed");

  const createRes = await fetch(
    "https://api.magichour.ai/v1/image-background-remover",
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        assets: { image_file_path: upload.file_path },
        name: "IDali background removal",
      }),
    },
  );
  if (!createRes.ok) throw new Error("Magic Hour project creation failed");
  const project = await createRes.json();
  if (!project?.id) throw new Error("Magic Hour project ID missing");

  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const statusRes = await fetch(
      `https://api.magichour.ai/v1/image-projects/${encodeURIComponent(project.id)}`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );
    if (!statusRes.ok) continue;
    const status = await statusRes.json();
    if (status?.status === "complete") {
      const outputUrl = status.downloads?.[0]?.url;
      if (!outputUrl) throw new Error("Magic Hour output URL missing");
      const imgRes = await fetch(outputUrl);
      if (!imgRes.ok) throw new Error("Magic Hour image download failed");
      const output = new File(
        Paths.cache,
        `idali-background-removed-${Date.now()}.png`,
      );
      output.write(new Uint8Array(await imgRes.arrayBuffer()));
      return output.uri;
    }
    if (["error", "canceled", "cancelled"].includes(status?.status)) {
      throw new Error("Magic Hour processing failed");
    }
  }
  throw new Error("Magic Hour timed out");
}

export async function removeBackground(imageUri: string): Promise<string> {
  const upload = getUploadMetadata(imageUri);
  const sourceFile = new File(imageUri);
  const apiUrl = getBackgroundRemovalApiUrl();

  // Strategy 1: Attempt backend server call (auto-resolved host IP)
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: await sourceFile.base64(),
        fileName: upload.name,
        mimeType: upload.type,
      }),
    });

    if (response.ok) {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("image/png")) {
        const output = new File(
          Paths.cache,
          `idali-background-removed-${Date.now()}.png`,
        );
        output.write(new Uint8Array(await response.arrayBuffer()));
        return output.uri;
      }
    }
  } catch {
    // Fall through to direct client calls if server is unreachable
  }

  // Strategy 2: Direct API fallback from mobile client
  const base64Data = await sourceFile.base64();

  const removeBgKey = getApiKey("REMOVE_BG_API_KEY");
  if (removeBgKey) {
    try {
      return await removeWithRemoveBgDirect(base64Data, removeBgKey);
    } catch {
      // Try backup
    }
  }

  const magicHourKey = getApiKey("MAGIC_HOUR_API_KEY");
  if (magicHourKey) {
    try {
      return await removeWithMagicHourDirect(
        imageUri,
        upload.type,
        upload.name,
        magicHourKey,
      );
    } catch {
      // Fall through
    }
  }

  throw new Error(DEFAULT_ERROR_MESSAGE);
}
