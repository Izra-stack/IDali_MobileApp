import { File, Paths } from "expo-file-system";

const POOF_REMOVE_URL = "https://api.poof.bg/v1/remove";
const POOF_API_KEY = "pk_cc58be28b758633251ad3836ee8af70d";

// Function: infer a safe upload name and MIME type from the local image URI.
function getUploadMetadata(imageUri: string) {
  const extension = imageUri.split("?")[0].split(".").pop()?.toLowerCase();
  if (extension === "png")
    return { type: "image/png", name: "idali-photo.png" };
  if (extension === "webp")
    return { type: "image/webp", name: "idali-photo.webp" };
  return { type: "image/jpeg", name: "idali-photo.jpg" };
}

export async function removeBackground(imageUri: string) {
  const upload = getUploadMetadata(imageUri);
  const sourceFile = new File(imageUri);
  let response: Response | undefined;

  // Retry once when Poof rate-limits the request.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const form = new FormData();
    form.append("image_file", sourceFile, upload.name);
    form.append("format", "png");
    form.append("size", "full");

    response = await fetch(POOF_REMOVE_URL, {
      method: "POST",
      headers: { "x-api-key": POOF_API_KEY },
      body: form,
    });

    if (response.status !== 429 || attempt === 1) break;
    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  if (!response) throw new Error("Poof did not return a response.");

  if (!response.ok) {
    let message = `Poof request failed (${response.status}).`;
    try {
      const error = (await response.json()) as {
        message?: string;
        error?: string;
      };
      if (error.message || error.error)
        message = error.message ?? error.error ?? message;
    } catch {
      // Keep the status-based message when the service does not return JSON.
    }
    throw new Error(message);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("image/png"))
    throw new Error("Poof returned an invalid image response.");

  const output = new File(
    Paths.cache,
    `idali-background-removed-${Date.now()}.png`,
  );
  output.write(new Uint8Array(await response.arrayBuffer()));
  return output.uri;
}
