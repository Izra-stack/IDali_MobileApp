import http from "node:http";
import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_ERROR_MESSAGE,
  decodeImageRequest,
  server,
  shouldFallbackFromRemoveBg,
} from "./server.js";

function postImage(port) {
  const body = JSON.stringify({
    imageBase64: Buffer.from("input-image").toString("base64"),
    fileName: "idali-photo.jpg",
    mimeType: "image/jpeg",
  });

  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path: "/api/remove-background",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () =>
          resolve({
            status: response.statusCode,
            headers: response.headers,
            body: Buffer.concat(chunks),
          }),
        );
      },
    );
    request.on("error", reject);
    request.end(body);
  });
}

async function withServer(callback) {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No test port");
  try {
    await callback(address.port);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("falls back for remove.bg rate limits, quota errors, and server errors", () => {
  assert.equal(shouldFallbackFromRemoveBg(429), true);
  assert.equal(shouldFallbackFromRemoveBg(503), true);
  assert.equal(shouldFallbackFromRemoveBg(402, "insufficient credits"), true);
  assert.equal(shouldFallbackFromRemoveBg(403, "monthly quota exceeded"), true);
  assert.equal(shouldFallbackFromRemoveBg(400, "invalid image"), false);
});

test("decodes a bounded image request", () => {
  const value = decodeImageRequest({
    imageBase64: Buffer.from("image").toString("base64"),
    fileName: "photo.png",
    mimeType: "image/png",
  });

  assert.equal(value.fileName, "photo.png");
  assert.equal(value.mimeType, "image/png");
  assert.equal(value.imageBuffer.toString(), "image");
});

test("uses a generic final provider failure message", () => {
  assert.match(DEFAULT_ERROR_MESSAGE, /try again/i);
});

test("returns remove.bg output when the primary provider succeeds", async () => {
  const previousFetch = globalThis.fetch;
  const previousRemoveKey = process.env.REMOVE_BG_API_KEY;
  const previousMagicKey = process.env.MAGIC_HOUR_API_KEY;
  const output = Buffer.from("remove-bg-png");

  process.env.REMOVE_BG_API_KEY = "remove-test-key";
  process.env.MAGIC_HOUR_API_KEY = "magic-test-key";
  globalThis.fetch = async () =>
    new Response(output, {
      status: 200,
      headers: { "content-type": "image/png" },
    });

  try {
    await withServer(async (port) => {
      const response = await postImage(port);
      assert.equal(response.status, 200);
      assert.equal(response.headers["x-idali-provider"], "remove.bg");
      assert.deepEqual(response.body, output);
    });
  } finally {
    globalThis.fetch = previousFetch;
    if (previousRemoveKey === undefined) delete process.env.REMOVE_BG_API_KEY;
    else process.env.REMOVE_BG_API_KEY = previousRemoveKey;
    if (previousMagicKey === undefined) delete process.env.MAGIC_HOUR_API_KEY;
    else process.env.MAGIC_HOUR_API_KEY = previousMagicKey;
  }
});

test("uses Magic Hour output when remove.bg is rate-limited", async () => {
  const previousFetch = globalThis.fetch;
  const previousRemoveKey = process.env.REMOVE_BG_API_KEY;
  const previousMagicKey = process.env.MAGIC_HOUR_API_KEY;
  const output = Buffer.from("magic-hour-png");
  const responses = [
    new Response("rate limited", { status: 429 }),
    new Response(
      JSON.stringify({
        items: [
          {
            upload_url: "https://upload.test/idali-photo.jpg",
            file_path: "api-assets/id/idali-photo.jpg",
          },
        ],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    ),
    new Response(null, { status: 200 }),
    new Response(JSON.stringify({ id: "job-1" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
    new Response(
      JSON.stringify({
        status: "complete",
        downloads: [{ url: "https://download.test/idali-photo.png" }],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    ),
    new Response(output, {
      status: 200,
      headers: { "content-type": "image/png" },
    }),
  ];

  process.env.REMOVE_BG_API_KEY = "remove-test-key";
  process.env.MAGIC_HOUR_API_KEY = "magic-test-key";
  globalThis.fetch = async () => {
    const response = responses.shift();
    if (!response) throw new Error("Unexpected provider request");
    return response;
  };

  try {
    await withServer(async (port) => {
      const response = await postImage(port);
      assert.equal(response.status, 200);
      assert.equal(response.headers["x-idali-provider"], "Magic Hour");
      assert.deepEqual(response.body, output);
      assert.equal(responses.length, 0);
    });
  } finally {
    globalThis.fetch = previousFetch;
    if (previousRemoveKey === undefined) delete process.env.REMOVE_BG_API_KEY;
    else process.env.REMOVE_BG_API_KEY = previousRemoveKey;
    if (previousMagicKey === undefined) delete process.env.MAGIC_HOUR_API_KEY;
    else process.env.MAGIC_HOUR_API_KEY = previousMagicKey;
  }
});
