import { File } from "expo-file-system";

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  format: string;
  resourceType: string;
  width: number;
  height: number;
  bytes?: number;
  createdAt?: string;
}

export interface CloudinaryApiErrorResponse {
  error?: {
    message?: string;
  };
}

function getUploadMimeTypeAndName(fileUri: string): { type: string; name: string } {
  const cleanUri = fileUri.split("?")[0];
  const extension = cleanUri.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "png":
      return { type: "image/png", name: "upload.png" };
    case "webp":
      return { type: "image/webp", name: "upload.webp" };
    case "gif":
      return { type: "image/gif", name: "upload.gif" };
    case "heic":
      return { type: "image/heic", name: "upload.heic" };
    case "jpg":
    case "jpeg":
    default:
      return { type: "image/jpeg", name: "upload.jpg" };
  }
}

/**
 * Uploads an image file URI from React Native / Expo to Cloudinary using an unsigned upload preset.
 * 
 * @param fileUri Local file URI (e.g. file:///... or ph://...)
 * @returns Clean typed result containing secureUrl, publicId, format, resourceType, width, height.
 */
export async function uploadToCloudinary(fileUri: string): Promise<CloudinaryUploadResult> {
  if (!fileUri || typeof fileUri !== "string" || !fileUri.trim()) {
    throw new Error("Cloudinary Upload Error: A valid fileUri string is required.");
  }

  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();

  if (!cloudName) {
    throw new Error(
      "Cloudinary Upload Error: EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME environment variable is missing."
    );
  }

  if (!uploadPreset) {
    throw new Error(
      "Cloudinary Upload Error: EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET environment variable is missing."
    );
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const { type, name } = getUploadMimeTypeAndName(fileUri);

  const cleanFileUri = fileUri.startsWith("file://")
    ? fileUri
    : fileUri.startsWith("/")
      ? `file://${fileUri}`
      : fileUri;

  const fileObj = new File(cleanFileUri);
  const base64Data = await fileObj.base64();
  const dataUrl = `data:${type};base64,${base64Data}`;

  const formData = new FormData();
  formData.append("file", dataUrl);
  formData.append("upload_preset", uploadPreset);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Cloudinary Network Error: Failed to send request to Cloudinary (${errMessage})`);
  }

  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      (responseData as CloudinaryApiErrorResponse | null)?.error?.message ||
      `HTTP status ${response.status}`;
    throw new Error(`Cloudinary API Upload Error: ${errorMessage}`);
  }

  if (!responseData || typeof responseData !== "object") {
    throw new Error("Cloudinary API Upload Error: Received invalid response structure from Cloudinary.");
  }

  return {
    secureUrl: responseData.secure_url ?? "",
    publicId: responseData.public_id ?? "",
    format: responseData.format ?? "",
    resourceType: responseData.resource_type ?? "image",
    width: Number(responseData.width) || 0,
    height: Number(responseData.height) || 0,
    bytes: typeof responseData.bytes === "number" ? responseData.bytes : undefined,
    createdAt: typeof responseData.created_at === "string" ? responseData.created_at : undefined,
  };
}
