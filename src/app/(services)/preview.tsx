import { Ionicons } from "@expo/vector-icons";
import Constants, { AppOwnership } from "expo-constants";
import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import { auth } from "../../../firebase/config";
import { PhotoSheet } from "../../components/PhotoSheet";
import { useDatabase } from "../../database/DatabaseProvider";
import {
  getPackagePlan,
  saveLayout,
  updateLayoutCloudinaryData,
} from "../../database/queries";
import { uploadToCloudinary } from "../../services/cloudinary/cloudinaryUpload";
import { SharedState } from "../../SharedState";
import styles from "../../styles/services/preview.styles";

const normalizeLocalFileUri = (uri: string) => {
  const value = uri.trim();
  if (!value) throw new Error("The generated file URI is empty.");
  if (/^(https?:|data:)/i.test(value)) {
    throw new Error("The generated file is not an app-readable local file.");
  }
  if (value.startsWith("file://") || value.startsWith("content://")) return value;
  if (value.startsWith("/")) return `file://${value}`;
  return value;
};

const copyToReadableFile = async (
  sourceUri: string,
  destination: File,
  label: string,
) => {
  const normalizedSourceUri = normalizeLocalFileUri(sourceUri);
  const source = new File(normalizedSourceUri);
  if (destination.exists) destination.delete();
  try {
    await source.copy(destination);
  } catch {
    if (normalizedSourceUri.startsWith("file://")) {
      const base64Str = await source.base64();
      destination.write(base64Str, { encoding: "base64" });
    }
  }
  return destination;
};

const persistPrintedPdf = async (result: { uri?: string; base64?: string }) => {
  const destination = new File(Paths.cache, `IDali_Layout_${Date.now()}.pdf`);
  if (destination.exists) destination.delete();

  if (result.base64) {
    destination.write(result.base64, { encoding: "base64" });
  } else if (result.uri) {
    await copyToReadableFile(result.uri, destination, "Generated PDF");
  } else {
    throw new Error("PDF generation returned no readable file data.");
  }

  return destination;
};

const shareLocalFile = async (
  file: File,
  mimeType: string,
  dialogTitle: string,
) => {
  const uri = normalizeLocalFileUri(file.uri);
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(uri, {
    mimeType,
    dialogTitle,
    UTI: mimeType === "application/pdf" ? "com.adobe.pdf" : "public.png",
  });
  return true;
};

const isCancellationError = (error: unknown) =>
  /cancel|canceled|cancelled|dismiss/i.test(
    error instanceof Error ? error.message : String(error),
  );

export default function PreviewScreen() {
  const router = useRouter();
  const db = useDatabase();
  const offscreenRef = useRef<View>(null);
  const operationInFlightRef = useRef(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const imageUri = SharedState.imageUri;
  const idSize = SharedState.idSize;
  const paperSize = SharedState.paperSize;
  const bgColor = SharedState.bgColor;
  const numberOfCopies = Math.max(1, SharedState.numberOfCopies || 1);
  const plan = getPackagePlan(
    SharedState.packageId,
    idSize || "2x2 inches",
    paperSize || "A4",
  );
  const isExpoGo = Constants.appOwnership === AppOwnership.Expo;

  const beginOperation = () => {
    if (operationInFlightRef.current) return false;
    operationInFlightRef.current = true;
    setIsProcessing(true);
    return true;
  };

  const endOperation = () => {
    operationInFlightRef.current = false;
    setIsProcessing(false);
  };

  const captureLayoutImage = async () => {
    if (!offscreenRef.current) return null;
    try {
      return await captureRef(offscreenRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handleSave = async () => {
    if (!imageUri || !auth.currentUser) {
      Alert.alert(
        "Unable to save",
        "Please select an image and sign in again.",
      );
      return;
    }
    if (!beginOperation()) return;
    try {
      const uri = await captureLayoutImage();
      let layoutUri = null;
      if (uri) {
        const layoutFile = new File(Paths.document, `layout_${Date.now()}.png`);
        await copyToReadableFile(uri, layoutFile, "Layout image");
        layoutUri = layoutFile.uri;
      }

      const userId = auth.currentUser.uid;
      const layoutId = await saveLayout(db, {
        user_id: userId,
        photo_uri: imageUri,
        id_size: idSize || "2x2",
        paper_size: paperSize || "A4",
        background_color: bgColor || "White",
        package_id: SharedState.packageId || "a4-package",
        layout_uri: layoutUri,
      });

      if (layoutUri) {
        try {
          const cloudinaryResult = await uploadToCloudinary(layoutUri);
          await updateLayoutCloudinaryData(
            db,
            Number(layoutId),
            userId,
            cloudinaryResult.secureUrl,
            cloudinaryResult.publicId,
          );
        } catch (cloudinaryError) {
          console.error(
            "Cloudinary background upload failed (local layout preserved):",
            cloudinaryError,
          );
        }
      }
      router.replace("/(tabs)");
    } catch (e) {
      console.error("Local layout save failed:", e);
      Alert.alert("Save failed", "The layout could not be saved locally.");
    } finally {
      endOperation();
    }
  };

  const saveExportedLayout = async () => {
    if (!imageUri || !auth.currentUser) return;
    try {
      const uri = await captureLayoutImage();
      let layoutUri = null;
      if (uri) {
        const layoutFile = new File(Paths.document, `layout_${Date.now()}.png`);
        await copyToReadableFile(uri, layoutFile, "Layout image");
        layoutUri = layoutFile.uri;
      }

      const userId = auth.currentUser.uid;
      const layoutId = await saveLayout(db, {
        user_id: userId,
        photo_uri: imageUri,
        id_size: idSize || "2x2",
        paper_size: paperSize || "A4",
        background_color: bgColor || "White",
        package_id: SharedState.packageId || "a4-package",
        layout_uri: layoutUri,
      });

      if (layoutUri) {
        try {
          const cloudinaryResult = await uploadToCloudinary(layoutUri);
          await updateLayoutCloudinaryData(
            db,
            Number(layoutId),
            userId,
            cloudinaryResult.secureUrl,
            cloudinaryResult.publicId,
          );
        } catch (cloudinaryError) {
          console.error(
            "Cloudinary background upload failed (local layout preserved):",
            cloudinaryError,
          );
        }
      }
    } catch (e) {
      console.error("Auto-saving exported layout failed:", e);
    }
  };

  const generateHTML = async () => {
    if (!imageUri) throw new Error("No image URI available");
    let base64Image = "";
    try {
      const cleanUri = imageUri.startsWith("file://")
        ? imageUri
        : imageUri.startsWith("/")
          ? `file://${imageUri}`
          : imageUri;
      base64Image = await new File(cleanUri).base64();
    } catch (e) {
      const err = e;
      throw new Error(
        `Base64 error: ${err && typeof err === "object" && "message" in err ? err.message : String(err)}`,
      );
    }
    const imgSrc = `data:image/jpeg;base64,${base64Image}`;

    const hasText = !!SharedState.photoText?.trim();
    const photoText = SharedState.photoText ?? "";
    const textColor = SharedState.textColor ?? "#111827";
    const textBg = SharedState.textBackground ?? "#ffffff";
    const textFont =
      SharedState.textFont === "system"
        ? "sans-serif"
        : (SharedState.textFont ?? "sans-serif");

    let photosHtml = "";
    const slots = (plan.slots ?? []).slice(0, plan.copies);
    for (const slot of slots) {
      const left = slot.left;
      const top = slot.top;
      const textHtml = hasText
        ? `<div style="width: 100%; background-color: ${textBg}; color: ${textColor}; font-family: ${textFont}; font-size: 8pt; font-weight: 600; text-align: center; padding: 2px 0; border-top: 1px solid #e5e7eb; box-sizing: border-box; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${photoText}</div>`
        : "";
      photosHtml += `
        <div style="position: absolute; left: ${left}mm; top: ${top}mm; width: ${slot.photoWidth}mm; height: ${slot.photoHeight}mm; background-color: white; border: 1px solid #d1d5db; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden;">
          <div style="flex: 1; width: 100%; overflow: hidden; display: flex; align-items: center; justify-content: center;">
            <img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          ${textHtml}
        </div>
      `;
    }

    const bg =
      bgColor === "Blue"
        ? "#eff6ff"
        : bgColor === "Red"
          ? "#fef2f2"
          : "#f3f4f6";
    let pagesHtml = "";
    for (let c = 0; c < numberOfCopies; c += 1) {
      pagesHtml += `
        <div style="width: ${plan.paperWidth}mm; height: ${plan.paperHeight}mm; position: relative; background-color: ${bg}; overflow: hidden; page-break-after: ${c < numberOfCopies - 1 ? "always" : "auto"};">
          ${photosHtml}
        </div>
      `;
    }

    return `
      <html>
        <head>
          <style>
            @page { margin: 0; size: ${plan.paperWidth}mm ${plan.paperHeight}mm; }
            body { margin: 0; padding: 0; }
          </style>
        </head>
        <body>
          ${pagesHtml}
        </body>
      </html>
    `;
  };

  const handleExportPDF = async () => {
    if (!beginOperation()) return;
    setExportModalVisible(false);
    try {
      const html = await generateHTML();
      if (!html) throw new Error("HTML generation failed silently");

      const pointsPerMm = 72 / 25.4;
      const printResult = await Print.printToFileAsync({
        html,
        width: plan.paperWidth * pointsPerMm,
        height: plan.paperHeight * pointsPerMm,
        base64: true,
      });

      const pdfFile = await persistPrintedPdf(printResult);
      const shared = await shareLocalFile(
        pdfFile,
        "application/pdf",
        "Share IDali PDF",
      );
      if (!shared) {
        Alert.alert(
          "PDF Ready",
          "The PDF was generated, but sharing is unavailable on this device. Please try a development build or another device with a share service.",
        );
      } else {
        await saveExportedLayout();
        router.replace("/(tabs)");
      }
    } catch (e) {
      console.error("PDF export failed:", e);
      Alert.alert(
        isCancellationError(e) ? "Export Canceled" : "PDF Export Failed",
        isCancellationError(e)
          ? "The share sheet was closed before the PDF was shared."
          : "The PDF could not be prepared as a readable local file. Please try again.",
      );
    } finally {
      endOperation();
    }
  };

  const handleSaveToGallery = async () => {
    if (!beginOperation()) return;
    setExportModalVisible(false);
    try {
      const uri = await captureLayoutImage();
      if (!uri)
        throw new Error("Could not render layout image preview for export");
      const imageFile = await copyToReadableFile(
        uri,
        new File(Paths.cache, `IDali_Layout_${Date.now()}.png`),
        "Generated image",
      );

      if (isExpoGo) {
        try {
          const shared = await shareLocalFile(
            imageFile,
            "image/png",
            "Save IDali image",
          );
          if (shared) {
            Alert.alert(
              "Choose a Save Location",
              "Expo Go cannot save directly to the gallery. Choose Photos, Gallery, or Files from the share sheet.",
            );
            await saveExportedLayout();
            router.replace("/(tabs)");
            return;
          }
        } catch (shareError) {
          console.error("Expo Go image fallback failed:", shareError);
        }
        Alert.alert(
          "Gallery Access Unavailable",
          "Expo Go cannot provide direct gallery access on this Android version. Use a development build or enable a system share service.",
        );
        return;
      }

      try {
        const mediaLibrary = await import("expo-media-library");
        let permission = await mediaLibrary.getPermissionsAsync(false, [
          "photo",
        ]);
        if (!permission.granted && permission.canAskAgain) {
          permission = await mediaLibrary.requestPermissionsAsync(false, [
            "photo",
          ]);
        }
        if (!permission.granted)
          throw new Error("Photo permission was denied.");
        await mediaLibrary.Asset.create(imageFile.uri);
        Alert.alert("Success", "Layout saved to gallery!");
        await saveExportedLayout();
        router.replace("/(tabs)");
      } catch (mediaLibraryError) {
        console.error("Direct gallery save failed:", mediaLibraryError);
        try {
          const shared = await shareLocalFile(
            imageFile,
            "image/png",
            "Save IDali image",
          );
          if (shared) {
            Alert.alert(
              "Gallery Access Unavailable",
              "Direct gallery access is unavailable here. Choose Photos, Gallery, or Files from the share sheet, or install a development build for direct saving.",
            );
            await saveExportedLayout();
            router.replace("/(tabs)");
            return;
          }
        } catch (shareError) {
          console.error("Image share fallback failed:", shareError);
        }
        throw new Error(
          "Direct gallery access and system sharing are unavailable.",
        );
      }
    } catch (e) {
      console.error("Gallery export failed:", e);
      Alert.alert(
        isCancellationError(e) ? "Save Canceled" : "Save Unavailable",
        isCancellationError(e)
          ? "No image was saved."
          : "The layout could not be saved. Use the share sheet to choose Photos, Gallery, or Files, or use a development build for direct gallery saving.",
      );
    } finally {
      endOperation();
    }
  };

  const handleShareImage = async () => {
    if (!beginOperation()) return;
    setExportModalVisible(false);
    try {
      const uri = await captureLayoutImage();
      if (!uri) throw new Error("Could not capture image");
      const imageFile = await copyToReadableFile(
        uri,
        new File(Paths.cache, `IDali_Layout_${Date.now()}.png`),
        "Generated image",
      );
      if (
        !(await shareLocalFile(imageFile, "image/png", "Share IDali image"))
      ) {
        Alert.alert(
          "Sharing Unavailable",
          "Image sharing is unavailable on this device.",
        );
      } else {
        await saveExportedLayout();
        router.replace("/(tabs)");
      }
    } catch (e) {
      console.error("Image sharing failed:", e);
      Alert.alert(
        isCancellationError(e) ? "Share Canceled" : "Image Share Failed",
        isCancellationError(e)
          ? "The share sheet was closed before the image was shared."
          : "The image could not be prepared as a readable local file.",
      );
    } finally {
      endOperation();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Layout Preview</Text>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.replace("/(tabs)")}
        >
          <Ionicons name="home-outline" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.resultCard}>
          <View style={styles.successHeader}>
            <Ionicons
              name="checkmark-circle"
              size={28}
              color="#166534"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.resultTitle}>Layout Generated</Text>
          </View>

          {imageUri ? (
            <PhotoSheet
              imageUri={imageUri}
              plan={plan}
              backgroundColor={
                bgColor === "Blue"
                  ? "#eff6ff"
                  : bgColor === "Red"
                    ? "#fef2f2"
                    : "#f3f4f6"
              }
              photoText={SharedState.photoText}
              textFont={SharedState.textFont}
              textSize={SharedState.textSize}
              textColor={SharedState.textColor}
              textBackground={SharedState.textBackground}
            />
          ) : (
            <View
              style={[
                styles.resultImagePlaceholder,
                {
                  backgroundColor: "#f3f4f6",
                  aspectRatio: plan.paperWidth / plan.paperHeight,
                },
              ]}
            >
              <Ionicons name="grid-outline" size={60} color="#d1d5db" />
            </View>
          )}
          <Text style={styles.noImageText}>
            Preview ({plan.copies} photos/sheet × {numberOfCopies}{" "}
            {numberOfCopies === 1 ? "copy" : "copies"} ={" "}
            {plan.copies * numberOfCopies} photos · {paperSize || "A4"} ·{" "}
            {SharedState.packageId === "mixed-package"
              ? "Mixed Package"
              : idSize || "selected size"}
            )
          </Text>

          <View style={styles.resultButtons}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleSave}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#3b74f6" />
              ) : (
                <>
                  <Ionicons
                    name="save-outline"
                    size={20}
                    color="#3b74f6"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.retryButtonText}>Save</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => setExportModalVisible(true)}
              disabled={isProcessing}
            >
              <Ionicons
                name="share-outline"
                size={20}
                color="#ffffff"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.continueButtonText}>Export</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={{ position: "absolute", top: -10000, left: -10000 }}>
        <View ref={offscreenRef} collapsable={false}>
          {imageUri && (
            <PhotoSheet
              imageUri={imageUri}
              plan={plan}
              backgroundColor={
                bgColor === "Blue"
                  ? "#eff6ff"
                  : bgColor === "Red"
                    ? "#fef2f2"
                    : "#f3f4f6"
              }
              fixedWidth={plan.paperWidth * 10}
              photoText={SharedState.photoText}
              textFont={SharedState.textFont}
              textSize={SharedState.textSize}
              textColor={SharedState.textColor}
              textBackground={SharedState.textBackground}
            />
          )}
        </View>
      </View>

      <Modal
        visible={exportModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setExportModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}
            >
              Export Options
            </Text>

            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#f3f4f6",
              }}
              onPress={handleSaveToGallery}
              disabled={isProcessing}
            >
              <Ionicons
                name="image-outline"
                size={24}
                color="#374151"
                style={{ marginRight: 12 }}
              />
              <Text style={{ fontSize: 16, color: "#111827" }}>
                Save to Gallery
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#f3f4f6",
              }}
              onPress={handleExportPDF}
              disabled={isProcessing}
            >
              <Ionicons
                name="document-text-outline"
                size={24}
                color="#374151"
                style={{ marginRight: 12 }}
              />
              <Text style={{ fontSize: 16, color: "#111827" }}>
                Export as PDF ({numberOfCopies}{" "}
                {numberOfCopies === 1 ? "page" : "pages"})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#f3f4f6",
              }}
              onPress={handleShareImage}
              disabled={isProcessing}
            >
              <Ionicons
                name="share-social-outline"
                size={24}
                color="#374151"
                style={{ marginRight: 12 }}
              />
              <Text style={{ fontSize: 16, color: "#111827" }}>
                Share Image
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                marginTop: 16,
                alignItems: "center",
                paddingVertical: 12,
                backgroundColor: "#f3f4f6",
                borderRadius: 12,
              }}
              onPress={() => setExportModalVisible(false)}
              disabled={isProcessing}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: "#374151" }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
