import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, PanResponder, Pressable, ScrollView, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { removeBackground } from "../../services/removeBackground";
import { persistSharedState, SharedState } from "../../SharedState";
import styles from "../../styles/services/editor.styles";

type CropRect = { left: number; top: number; width: number; height: number };
type CropMode = "move" | "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

function AdjustmentSlider({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const { width } = useWindowDimensions();
  const trackWidth = Math.max(120, Math.min(260, width - 194));
  const updateFromX = (locationX: number) => {
    const next = Math.max(-1, Math.min(1, (locationX / trackWidth) * 2 - 1));
    onChange(Math.round(next * 100) / 100);
  };
  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: event => updateFromX(event.nativeEvent.locationX),
    onPanResponderMove: event => updateFromX(event.nativeEvent.locationX),
  })).current;
  const thumbPosition = ((value + 1) / 2) * trackWidth;

  return (
    <View {...responder.panHandlers} style={{ width: trackWidth, height: 40, justifyContent: "center" }} accessibilityRole="adjustable">
      <View style={{ height: 5, borderRadius: 3, backgroundColor: "#dbeafe", overflow: "hidden" }}>
        <View style={{ width: `${((value + 1) / 2) * 100}%`, height: "100%", backgroundColor: "#3b74f6" }} />
      </View>
      <View style={{ position: "absolute", left: thumbPosition - 10, width: 20, height: 20, borderRadius: 10, backgroundColor: "#3b74f6", borderWidth: 3, borderColor: "#ffffff", shadowColor: "#1d4ed8", shadowOpacity: 0.2, shadowRadius: 3, elevation: 2 }} />
    </View>
  );
}

export default function EditorScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState(SharedState.imageUri);
  const [brightness, setBrightness] = useState(SharedState.brightness ?? 0);
  const [contrast, setContrast] = useState(SharedState.contrast ?? 0);
  const [processing, setProcessing] = useState(false);
  const [backgroundRemovalUndoUri, setBackgroundRemovalUndoUri] = useState<
    string | null
  >(null);
  const [adjustmentsOpen, setAdjustmentsOpen] = useState(false);
  const adjustmentSnapshot = useRef({ brightness: SharedState.brightness ?? 0, contrast: SharedState.contrast ?? 0 });
  const [cropOpen, setCropOpen] = useState(false);
  const [cropStageSize, setCropStageSize] = useState({ width: 0, height: 0 });
  const [cropImageSize, setCropImageSize] = useState({ width: 0, height: 0 });
  const [cropFrame, setCropFrame] = useState<CropRect | null>(null);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const cropRectRef = useRef<CropRect | null>(null);
  const cropFrameRef = useRef<CropRect | null>(null);
  const cropStartRef = useRef<CropRect | null>(null);
  const cropModeRef = useRef<CropMode | null>(null);
  const [textOpen, setTextOpen] = useState(false);
  const [overlayText, setOverlayText] = useState("");
  const [textFont, setTextFont] = useState("system");
  const [textSize, setTextSize] = useState(20);
  const [textColor, setTextColor] = useState("#111827");
  const [textBackground, setTextBackground] = useState<string | null>(
    "rgba(255,255,255,0.75)",
  );
  const [textColorInput, setTextColorInput] = useState("#111827");
  const [backgroundColorInput, setBackgroundColorInput] = useState("#ffffff");
  const fontOptions = [
    { label: "System", value: "system" },
    { label: "Sans", value: "sans-serif" },
    { label: "Light", value: "sans-serif-light" },
    { label: "Medium", value: "sans-serif-medium" },
    { label: "Condensed", value: "sans-serif-condensed" },
    { label: "Serif", value: "serif" },
    { label: "Mono", value: "monospace" },
    { label: "Thin", value: "sans-serif-thin" },
    { label: "Black", value: "sans-serif-black" },
  ];
  const commonFontSizes = [
    8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72,
  ];
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const textPositionRef = useRef({ x: 0, y: 0 });
  const textStartPositionRef = useRef({ x: 0, y: 0 });
  const textPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        textStartPositionRef.current = textPositionRef.current;
      },
      onPanResponderMove: (_, gestureState) => {
        const nextPosition = {
          x: textStartPositionRef.current.x + gestureState.dx,
          y: textStartPositionRef.current.y + gestureState.dy,
        };
        textPositionRef.current = nextPosition;
        setTextPosition(nextPosition);
      },
    }),
  ).current;

  const rotateImage = async () => {
    if (!imageUri) return;
    try {
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ rotate: 90 }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
      );
      setImageUri(result.uri);
      SharedState.imageUri = result.uri;
      await persistSharedState();
    } catch {
      Alert.alert("Edit failed", "The photo could not be rotated.");
    }
  };

  const openCrop = () => {
    if (!imageUri) return;
    setCropRect(null);
    cropRectRef.current = null;
    setCropFrame(null);
    cropFrameRef.current = null;
    setCropOpen(true);
  };

  useEffect(() => {
    if (!cropOpen || !imageUri || cropStageSize.width === 0 || cropStageSize.height === 0) return;
    let active = true;
    Image.getSize(imageUri, (width, height) => {
      if (!active) return;
      const scale = Math.min(cropStageSize.width / width, cropStageSize.height / height);
      const frame = {
        left: (cropStageSize.width - width * scale) / 2,
        top: (cropStageSize.height - height * scale) / 2,
        width: width * scale,
        height: height * scale,
      };
      const inset = Math.min(frame.width, frame.height) * 0.08;
      const initialCrop = {
        left: frame.left + inset,
        top: frame.top + inset,
        width: frame.width - inset * 2,
        height: frame.height - inset * 2,
      };
      setCropImageSize({ width, height });
      setCropFrame(frame);
      cropFrameRef.current = frame;
      setCropRect(initialCrop);
      cropRectRef.current = initialCrop;
    }, () => Alert.alert("Crop failed", "The photo dimensions could not be read."));
    return () => { active = false; };
  }, [cropOpen, cropStageSize, imageUri]);

  const getCropMode = (x: number, y: number, rect: CropRect): CropMode | null => {
    const handleRadius = 28;
    const nearLeft = Math.abs(x - rect.left) <= handleRadius;
    const nearRight = Math.abs(x - (rect.left + rect.width)) <= handleRadius;
    const nearTop = Math.abs(y - rect.top) <= handleRadius;
    const nearBottom = Math.abs(y - (rect.top + rect.height)) <= handleRadius;
    if (nearTop && nearLeft) return "top-left";
    if (nearTop && nearRight) return "top-right";
    if (nearBottom && nearLeft) return "bottom-left";
    if (nearBottom && nearRight) return "bottom-right";
    if (nearLeft && y >= rect.top && y <= rect.top + rect.height) return "left";
    if (nearRight && y >= rect.top && y <= rect.top + rect.height) return "right";
    if (nearTop && x >= rect.left && x <= rect.left + rect.width) return "top";
    if (nearBottom && x >= rect.left && x <= rect.left + rect.width) return "bottom";
    if (x >= rect.left && x <= rect.left + rect.width && y >= rect.top && y <= rect.top + rect.height) return "move";
    return null;
  };

  const cropResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: event => {
      const rect = cropRectRef.current;
      if (!rect) return;
      cropModeRef.current = getCropMode(event.nativeEvent.locationX, event.nativeEvent.locationY, rect);
      cropStartRef.current = rect;
    },
    onPanResponderMove: (_, gestureState) => {
      const start = cropStartRef.current;
      const frame = cropFrameRef.current;
      const mode = cropModeRef.current;
      if (!start || !frame || !mode) return;
      const minSize = Math.min(48, frame.width, frame.height);
      let left = start.left;
      let top = start.top;
      let right = start.left + start.width;
      let bottom = start.top + start.height;

      if (mode === "move") {
        const dx = Math.max(frame.left - start.left, Math.min(frame.left + frame.width - start.width - start.left, gestureState.dx));
        const dy = Math.max(frame.top - start.top, Math.min(frame.top + frame.height - start.height - start.top, gestureState.dy));
        left += dx; right += dx; top += dy; bottom += dy;
      } else {
        if (mode.includes("left")) left = Math.max(frame.left, Math.min(right - minSize, start.left + gestureState.dx));
        if (mode.includes("right")) right = Math.min(frame.left + frame.width, Math.max(left + minSize, start.left + start.width + gestureState.dx));
        if (mode.includes("top")) top = Math.max(frame.top, Math.min(bottom - minSize, start.top + gestureState.dy));
        if (mode.includes("bottom")) bottom = Math.min(frame.top + frame.height, Math.max(top + minSize, start.top + start.height + gestureState.dy));
      }

      const next = { left, top, width: right - left, height: bottom - top };
      cropRectRef.current = next;
      setCropRect(next);
    },
    onPanResponderRelease: () => {
      cropModeRef.current = null;
      cropStartRef.current = null;
    },
    onPanResponderTerminate: () => {
      cropModeRef.current = null;
      cropStartRef.current = null;
    },
  })).current;

  const cancelCrop = () => {
    setCropOpen(false);
    setCropRect(null);
    setCropFrame(null);
    cropRectRef.current = null;
    cropFrameRef.current = null;
  };

  const applyCrop = async () => {
    if (!imageUri || !cropRect || !cropFrame || !cropImageSize.width || !cropImageSize.height) return;
    try {
      const scaleX = cropImageSize.width / cropFrame.width;
      const scaleY = cropImageSize.height / cropFrame.height;
      const crop = {
        originX: Math.max(0, Math.round((cropRect.left - cropFrame.left) * scaleX)),
        originY: Math.max(0, Math.round((cropRect.top - cropFrame.top) * scaleY)),
        width: Math.max(1, Math.round(cropRect.width * scaleX)),
        height: Math.max(1, Math.round(cropRect.height * scaleY)),
      };
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ crop }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
      );
      setImageUri(result.uri);
      SharedState.imageUri = result.uri;
      await persistSharedState();
      cancelCrop();
    } catch {
      Alert.alert("Edit failed", "The photo could not be cropped.");
    }
  };

  const handleRemoveBackground = async () => {
    if (!imageUri || processing) return;
    setProcessing(true);
    try {
      const originalUri = imageUri;
      const outputUri = await removeBackground(imageUri);
      setBackgroundRemovalUndoUri(originalUri);
      setImageUri(outputUri);
      SharedState.imageUri = outputUri;
      await persistSharedState();
    } catch (error) {
      Alert.alert(
        "Background removal failed",
        error instanceof Error ? error.message : "Please try again.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Try Again", onPress: handleRemoveBackground },
        ],
      );
    } finally {
      setProcessing(false);
    }
  };

  const undoBackgroundRemoval = async () => {
    if (!backgroundRemovalUndoUri || processing) return;
    setImageUri(backgroundRemovalUndoUri);
    SharedState.imageUri = backgroundRemovalUndoUri;
    setBackgroundRemovalUndoUri(null);
    await persistSharedState();
  };

  const openAdjustments = () => {
    adjustmentSnapshot.current = { brightness, contrast };
    setAdjustmentsOpen(true);
  };

  const cancelAdjustments = () => {
    setBrightness(adjustmentSnapshot.current.brightness);
    setContrast(adjustmentSnapshot.current.contrast);
    setAdjustmentsOpen(false);
  };

  const applyAdjustments = async () => {
    SharedState.brightness = brightness;
    SharedState.contrast = contrast;
    await persistSharedState();
    setAdjustmentsOpen(false);
  };

  const isHexColor = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Photo</Text>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => router.push("/(services)/layout-settings")}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        decelerationRate="normal"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.imageWorkspace}>
          {imageUri ? (
            <View
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <Image
                source={{ uri: imageUri }}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 16,
                  opacity: 1 - Math.max(0, -brightness) * 0.35,
                }}
                resizeMode="contain"
              />
              {brightness !== 0 && (
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: brightness > 0 ? "#ffffff" : "#000000",
                    opacity: Math.abs(brightness) * 0.25,
                  }}
                />
              )}
              {contrast !== 0 && (
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: contrast > 0 ? "#000000" : "#ffffff",
                    opacity: Math.abs(contrast) * 0.12,
                  }}
                />
              )}
              {!!overlayText && (
                <View
                  {...textPanResponder.panHandlers}
                  accessibilityLabel="Drag text"
                  style={{
                    position: "absolute",
                    left: 16,
                    right: 16,
                    bottom: 24,
                    alignItems: "center",
                    transform: [
                      { translateX: textPosition.x },
                      { translateY: textPosition.y },
                    ],
                  }}
                >
                  <Text
                    style={{
                      color: textColor,
                      backgroundColor: textBackground ?? "transparent",
                      padding: 8,
                      textAlign: "center",
                      fontSize: textSize,
                      fontFamily: textFont === "system" ? undefined : textFont,
                      fontWeight: "600",
                    }}
                  >
                    {overlayText}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Ionicons name="person" size={100} color="#9ca3af" />
          )}
        </View>

        <View style={styles.toolsContainer}>
          <Text style={styles.toolsTitle}>Editing Tools</Text>
          <ScrollView
            horizontal
            scrollEnabled
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.toolsScroll}
            contentContainerStyle={styles.toolsContent}
          >
            <TouchableOpacity
              style={styles.toolItem}
              onPress={openCrop}
              disabled={!imageUri}
            >
              <View style={styles.toolIcon}>
                <Ionicons name="crop" size={24} color="#3b74f6" />
              </View>
              <Text style={styles.toolText}>Crop</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolItem} onPress={rotateImage}>
              <View style={styles.toolIcon}>
                <Ionicons name="refresh-outline" size={24} color="#3b74f6" />
              </View>
              <Text style={styles.toolText}>Rotate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolItem}
              onPress={handleRemoveBackground}
              disabled={processing}
            >
              <View style={styles.toolIcon}>
                <Ionicons name="color-wand" size={24} color="#3b74f6" />
              </View>
              <Text style={styles.toolText}>
                {processing ? "Working…" : "Remove BG"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolItem}
              onPress={undoBackgroundRemoval}
              disabled={!backgroundRemovalUndoUri || processing}
            >
              <View
                style={[
                  styles.toolIcon,
                  !backgroundRemovalUndoUri && { opacity: 0.45 },
                ]}
              >
                <Ionicons name="arrow-undo-outline" size={24} color="#3b74f6" />
              </View>
              <Text
                style={[
                  styles.toolText,
                  !backgroundRemovalUndoUri && { opacity: 0.45 },
                ]}
              >
                Undo BG
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolItem}
              onPress={openAdjustments}
            >
              <View style={styles.toolIcon}>
                <Ionicons name="options" size={24} color="#3b74f6" />
              </View>
              <Text style={styles.toolText}>Adjust</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolItem}
              onPress={() => setTextOpen((value) => !value)}
            >
              <View style={styles.toolIcon}>
                <Ionicons name="text" size={24} color="#3b74f6" />
              </View>
              <Text style={styles.toolText}>Text</Text>
            </TouchableOpacity>
          </ScrollView>
          {adjustmentsOpen && (
            <View
              style={{
                marginHorizontal: 24,
                marginTop: 16,
                padding: 16,
                borderRadius: 16,
                backgroundColor: "#f8fafc",
                gap: 14,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ width: 74, color: "#374151", fontWeight: "600" }}>Brightness</Text>
                <AdjustmentSlider value={brightness} onChange={setBrightness} />
                <Text style={{ width: 36, marginLeft: 4, textAlign: "right", color: "#6b7280", fontSize: 12 }}>{Math.round(brightness * 100)}%</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ width: 74, color: "#374151", fontWeight: "600" }}>Contrast</Text>
                <AdjustmentSlider value={contrast} onChange={setContrast} />
                <Text style={{ width: 36, marginLeft: 4, textAlign: "right", color: "#6b7280", fontSize: 12 }}>{Math.round(contrast * 100)}%</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 2 }}>
                <TouchableOpacity onPress={cancelAdjustments} style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: "#e5e7eb" }}>
                  <Text style={{ color: "#374151", fontWeight: "600" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={applyAdjustments} style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: "#2563eb" }}>
                  <Text style={{ color: "#ffffff", fontWeight: "600" }}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {textOpen && (
            <View style={{ marginHorizontal: 24, marginTop: 16 }}>
              <TextInput
                value={overlayText}
                onChangeText={setOverlayText}
                placeholder="Enter text for the photo"
                style={{
                  height: 44,
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  color: "#111827",
                  backgroundColor: "#ffffff",
                }}
              />
              <Text
                style={{ marginTop: 14, color: "#374151", fontWeight: "600" }}
              >
                Font
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
              >
                {fontOptions.map((font) => (
                  <TouchableOpacity
                    key={font.value}
                    onPress={() => setTextFont(font.value)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 16,
                      backgroundColor:
                        textFont === font.value ? "#dbeafe" : "#f3f4f6",
                    }}
                  >
                    <Text
                      style={{
                        color: "#374151",
                        fontFamily:
                          font.value === "system" ? undefined : font.value,
                      }}
                    >
                      {font.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 14,
                }}
              >
                <Text style={{ color: "#374151", fontWeight: "600" }}>
                  Size
                </Text>
                <Text style={{ color: "#6b7280" }}>{textSize}px</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6, paddingVertical: 8 }}
              >
                {commonFontSizes.map((size) => (
                  <TouchableOpacity
                    key={size}
                    onPress={() => setTextSize(size)}
                    style={{
                      minWidth: 34,
                      paddingHorizontal: 7,
                      paddingVertical: 7,
                      borderRadius: 8,
                      backgroundColor:
                        textSize === size ? "#dbeafe" : "#f3f4f6",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#374151", fontSize: 12 }}>
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text
                style={{ marginTop: 14, color: "#374151", fontWeight: "600" }}
              >
                Text color
              </Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                {[
                  "#111827",
                  "#ffffff",
                  "#f3f4f6",
                  "#2563eb",
                  "#0891b2",
                  "#0d9488",
                  "#16a34a",
                  "#84cc16",
                  "#f59e0b",
                  "#f97316",
                  "#dc2626",
                  "#e11d48",
                  "#ec4899",
                  "#9333ea",
                  "#7c3aed",
                  "#92400e",
                ].map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => {
                      setTextColor(color);
                      setTextColorInput(color);
                    }}
                    accessibilityLabel={`Text color ${color}`}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: color,
                      borderWidth: textColor === color ? 3 : 1,
                      borderColor: textColor === color ? "#2563eb" : "#d1d5db",
                    }}
                  />
                ))}
              </View>
              <TextInput
                value={textColorInput}
                onChangeText={(value) => {
                  setTextColorInput(value);
                  if (isHexColor(value)) setTextColor(value);
                }}
                autoCapitalize="none"
                placeholder="#RRGGBB"
                style={{
                  height: 40,
                  marginTop: 8,
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  color: "#111827",
                  backgroundColor: "#ffffff",
                }}
              />
              <Text
                style={{ marginTop: 14, color: "#374151", fontWeight: "600" }}
              >
                Text background
              </Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() => setTextBackground(null)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 16,
                    backgroundColor:
                      textBackground === null ? "#dbeafe" : "#f3f4f6",
                  }}
                >
                  <Text style={{ color: "#374151" }}>None</Text>
                </TouchableOpacity>
                {[
                  "rgba(255,255,255,0.75)",
                  "rgba(17,24,39,0.78)",
                  "rgba(37,99,235,0.82)",
                  "rgba(8,145,178,0.82)",
                  "rgba(13,148,136,0.82)",
                  "rgba(22,163,74,0.82)",
                  "rgba(234,179,8,0.82)",
                  "rgba(234,88,12,0.82)",
                  "rgba(220,38,38,0.82)",
                  "rgba(219,39,119,0.82)",
                  "rgba(124,58,237,0.82)",
                ].map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setTextBackground(color)}
                    accessibilityLabel="Choose text background"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: color,
                      borderWidth: textBackground === color ? 3 : 1,
                      borderColor:
                        textBackground === color ? "#2563eb" : "#d1d5db",
                    }}
                  />
                ))}
              </View>
              <TextInput
                value={backgroundColorInput}
                onChangeText={(value) => {
                  setBackgroundColorInput(value);
                  if (isHexColor(value)) setTextBackground(value);
                }}
                autoCapitalize="none"
                placeholder="#RRGGBB"
                style={{
                  height: 40,
                  marginTop: 8,
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  color: "#111827",
                  backgroundColor: "#ffffff",
                }}
              />
              <Text style={{ marginTop: 8, color: "#6b7280", fontSize: 12 }}>
                Drag the text directly on the photo to position it.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      <Modal visible={processing} transparent animationType="fade" onRequestClose={() => undefined}>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="Removing Background"
          style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(17,24,39,0.72)" }}
        >
          <View style={{ minWidth: 220, alignItems: "center", paddingHorizontal: 28, paddingVertical: 26, borderRadius: 20, backgroundColor: "#ffffff" }}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={{ marginTop: 16, color: "#111827", fontSize: 16, fontWeight: "700" }}>Removing Background…</Text>
            <Text style={{ marginTop: 6, color: "#6b7280", fontSize: 13, textAlign: "center" }}>This may take a few seconds.</Text>
          </View>
        </View>
      </Modal>
      <Modal visible={cropOpen} animationType="slide" onRequestClose={cancelCrop}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#111827" }}>
          <View style={{ height: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 }}>
            <TouchableOpacity onPress={cancelCrop} accessibilityLabel="Cancel crop">
              <Text style={{ color: "#ffffff", fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "600" }}>Crop Photo</Text>
            <TouchableOpacity onPress={applyCrop} disabled={!cropRect} accessibilityLabel="Apply crop">
              <Text style={{ color: cropRect ? "#60a5fa" : "#6b7280", fontSize: 16, fontWeight: "700" }}>Done</Text>
            </TouchableOpacity>
          </View>
          <View
            style={{ flex: 1, backgroundColor: "#030712" }}
            onLayout={event => setCropStageSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
          >
            {imageUri && (
              <Image source={{ uri: imageUri }} style={{ position: "absolute", inset: 0 }} resizeMode="contain" />
            )}
            {cropRect && (
              <View
                {...cropResponder.panHandlers}
                style={{ position: "absolute", inset: 0 }}
                accessibilityLabel="Crop selection"
              >
                <View style={{ position: "absolute", left: 0, right: 0, top: 0, height: cropRect.top, backgroundColor: "rgba(0,0,0,0.55)" }} />
                <View style={{ position: "absolute", left: 0, right: 0, top: cropRect.top + cropRect.height, bottom: 0, backgroundColor: "rgba(0,0,0,0.55)" }} />
                <View style={{ position: "absolute", left: 0, top: cropRect.top, width: cropRect.left, height: cropRect.height, backgroundColor: "rgba(0,0,0,0.55)" }} />
                <View style={{ position: "absolute", left: cropRect.left + cropRect.width, right: 0, top: cropRect.top, height: cropRect.height, backgroundColor: "rgba(0,0,0,0.55)" }} />
                <View style={{ position: "absolute", left: cropRect.left, top: cropRect.top, width: cropRect.width, height: cropRect.height, borderWidth: 2, borderColor: "#ffffff" }} pointerEvents="none">
                  <View style={{ position: "absolute", left: "33.33%", top: 0, bottom: 0, borderLeftWidth: 1, borderColor: "rgba(255,255,255,0.55)" }} />
                  <View style={{ position: "absolute", left: "66.66%", top: 0, bottom: 0, borderLeftWidth: 1, borderColor: "rgba(255,255,255,0.55)" }} />
                  <View style={{ position: "absolute", top: "33.33%", left: 0, right: 0, borderTopWidth: 1, borderColor: "rgba(255,255,255,0.55)" }} />
                  <View style={{ position: "absolute", top: "66.66%", left: 0, right: 0, borderTopWidth: 1, borderColor: "rgba(255,255,255,0.55)" }} />
                </View>
                {[
                  { left: cropRect.left - 10, top: cropRect.top - 10 },
                  { left: cropRect.left + cropRect.width - 10, top: cropRect.top - 10 },
                  { left: cropRect.left - 10, top: cropRect.top + cropRect.height - 10 },
                  { left: cropRect.left + cropRect.width - 10, top: cropRect.top + cropRect.height - 10 },
                ].map((handle, index) => (
                  <View key={index} pointerEvents="none" style={{ position: "absolute", ...handle, width: 20, height: 20, borderRadius: 4, backgroundColor: "#ffffff" }} />
                ))}
              </View>
            )}
          </View>
          <View style={{ minHeight: 58, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 }}>
            <Text style={{ color: "#d1d5db", fontSize: 13 }}>Drag inside the frame to move it. Drag an edge or corner to resize.</Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
