import { Asset } from "expo-asset";
import { uploadToCloudinary, CloudinaryUploadResult } from "./cloudinaryUpload";

/**
 * DEVELOPMENT ONLY:
 * Test helper to verify Cloudinary upload functionality using a bundled asset image.
 */
export async function testCloudinaryUpload(): Promise<CloudinaryUploadResult> {
  console.log("[Cloudinary Test] Starting development upload test...");

  // Resolving bundled asset: assets/images/idali-logo.png
  const asset = Asset.fromModule(require("../../../assets/images/idali-logo.png"));
  await asset.downloadAsync();

  const localUri = asset.localUri || asset.uri;
  console.log(`[Cloudinary Test] Resolved local image URI: ${localUri}`);

  try {
    const result = await uploadToCloudinary(localUri);

    console.log("Cloudinary upload successful");
    console.log(`secureUrl: ${result.secureUrl}`);
    console.log(`publicId: ${result.publicId}`);
    console.log(`format: ${result.format}`);
    console.log(`resourceType: ${result.resourceType}`);
    console.log(`width: ${result.width}`);
    console.log(`height: ${result.height}`);

    return result;
  } catch (error) {
    console.error("[Cloudinary Test] Upload failed with error:", error);
    throw error;
  }
}
