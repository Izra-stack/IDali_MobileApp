import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Alert, Image, PanResponder, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { removeBackground } from "../../services/removeBackground";
import { persistSharedState, SharedState } from "../../SharedState";
import styles from "../../styles/services/editor.styles";

export default function EditorScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState(SharedState.imageUri);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [backgroundRemovalUndoUri, setBackgroundRemovalUndoUri] = useState<
    string | null
  >(null);
  const [adjustmentsOpen, setAdjustmentsOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
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

  const cropImage = async (aspect: "square" | "portrait" | "original") => {
    if (!imageUri) return;
    try {
      const size = await Image.getSize(imageUri);
      const targetRatio =
        aspect === "square"
          ? 1
          : aspect === "portrait"
            ? 35 / 45
            : size.width / size.height;
      let width = size.width;
      let height = size.height;
      if (width / height > targetRatio) width = height * targetRatio;
      else height = width / targetRatio;
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: (size.width - width) / 2,
              originY: (size.height - height) / 2,
              width,
              height,
            },
          },
        ],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
      );
      setImageUri(result.uri);
      SharedState.imageUri = result.uri;
      await persistSharedState();
      setCropOpen(false);
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

  const setAdjustment = (
    locationX: number,
    onChange: (value: number) => void,
  ) => {
    const value = Math.max(-1, Math.min(1, (locationX / 220) * 2 - 1));
    onChange(Math.round(value * 100) / 100);
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
              onPress={() => setCropOpen((value) => !value)}
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
              onPress={() => setAdjustmentsOpen((value) => !value)}
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
          {cropOpen && (
            <View
              style={{
                marginHorizontal: 24,
                marginTop: 16,
                padding: 14,
                borderRadius: 14,
                backgroundColor: "#f9fafb",
              }}
            >
              <Text
                style={{
                  color: "#374151",
                  fontWeight: "600",
                  marginBottom: 10,
                }}
              >
                Crop shape
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {(["square", "portrait", "original"] as const).map((aspect) => (
                  <TouchableOpacity
                    key={aspect}
                    onPress={() => cropImage(aspect)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 16,
                      backgroundColor: "#eff6ff",
                    }}
                  >
                    <Text style={{ color: "#2563eb", fontSize: 12 }}>
                      {aspect[0].toUpperCase() + aspect.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          {adjustmentsOpen && (
            <View
              style={{
                marginHorizontal: 24,
                marginTop: 16,
                padding: 14,
                borderRadius: 14,
                backgroundColor: "#f9fafb",
                gap: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{ width: 100, color: "#374151", fontWeight: "600" }}
                >
                  Brightness
                </Text>
                <Pressable
                  onPressIn={(event) =>
                    setAdjustment(event.nativeEvent.locationX, setBrightness)
                  }
                  onTouchMove={(event) =>
                    setAdjustment(event.nativeEvent.locationX, setBrightness)
                  }
                  style={{ width: 220, height: 28, justifyContent: "center" }}
                >
                  <View
                    style={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: "#bfdbfe",
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      left: `${(brightness + 1) * 50}%`,
                      marginLeft: -7,
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      backgroundColor: "#2563eb",
                    }}
                  />
                </Pressable>
                <Text
                  style={{ width: 42, textAlign: "right", color: "#6b7280" }}
                >
                  {Math.round(brightness * 100)}%
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{ width: 100, color: "#374151", fontWeight: "600" }}
                >
                  Contrast
                </Text>
                <Pressable
                  onPressIn={(event) =>
                    setAdjustment(event.nativeEvent.locationX, setContrast)
                  }
                  onTouchMove={(event) =>
                    setAdjustment(event.nativeEvent.locationX, setContrast)
                  }
                  style={{ width: 220, height: 28, justifyContent: "center" }}
                >
                  <View
                    style={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: "#bfdbfe",
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      left: `${(contrast + 1) * 50}%`,
                      marginLeft: -7,
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      backgroundColor: "#2563eb",
                    }}
                  />
                </Pressable>
                <Text
                  style={{ width: 42, textAlign: "right", color: "#6b7280" }}
                >
                  {Math.round(contrast * 100)}%
                </Text>
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
    </SafeAreaView>
  );
}
