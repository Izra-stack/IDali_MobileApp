import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PhotoSheet } from "../../components/PhotoSheet";
import { useDatabase } from "../../database/DatabaseProvider";
import {
  getPackagePlan,
  ID_PACKAGES,
  ID_PHOTO_SIZES,
  parseDimensions,
  type IdPhotoSize,
} from "../../database/queries";
import { persistSharedState, SharedState } from "../../SharedState";
import styles from "../../styles/services/layout-settings.styles";

export default function LayoutSettingsScreen() {
  const router = useRouter();
  const db = useDatabase();

  const [idSizes, setIdSizes] = useState<IdPhotoSize[]>(ID_PHOTO_SIZES);
  const initialPackage =
    SharedState.packageId === "mixed-package"
      ? "mixed-package"
      : "custom-package";
  const [packageId, setPackageId] = useState<string>(initialPackage);
  const [idSize, setIdSize] = useState<string>(
    SharedState.idSize || "2x2 inches",
  );
  const [paperSize, setPaperSize] = useState<string>(
    SharedState.paperSize || "A4",
  );
  const [bgColor, setBgColor] = useState<string>(
    SharedState.bgColor || "White",
  );
  const [numberOfCopies, setNumberOfCopies] = useState<number>(
    SharedState.numberOfCopies || 1,
  );
  const [copiesInputText, setCopiesInputText] = useState<string>(
    String(SharedState.numberOfCopies || 1),
  );

  // Derive package info and layout plan dynamically
  const selectedPackage = useMemo(
    () => ID_PACKAGES.find((pkg) => pkg.id === packageId) || ID_PACKAGES[0],
    [packageId],
  );

  const activeIdSize = selectedPackage.mixed ? "Mixed sizes" : idSize;
  const layoutPlan = useMemo(
    () => getPackagePlan(packageId, activeIdSize, paperSize),
    [packageId, activeIdSize, paperSize],
  );

  const [photoWidthMm, photoHeightMm] = useMemo(
    () => parseDimensions(activeIdSize),
    [activeIdSize],
  );

  const previewBackground =
    bgColor === "Blue"
      ? "#dbeafe"
      : bgColor === "Red"
        ? "#fee2e2"
        : bgColor === "Transparent"
          ? "#e5e7eb"
          : "#ffffff";

  // Load custom sizes catalog if available
  useEffect(() => {
    async function loadSizes() {
      try {
        const result = await db.getAllAsync<{
          name: string;
          width_mm: number;
          height_mm: number;
        }>("SELECT name, width_mm, height_mm FROM id_sizes");
        if (result.length > 0) {
          const byName = new Map(result.map((size) => [size.name, size]));
          setIdSizes(
            ID_PHOTO_SIZES.map((size) => ({
              ...size,
              ...(byName.get(size.name) ?? {}),
            })),
          );
        }
      } catch {
        // Built-in sizes fallback
      }
    }
    void loadSizes();
  }, [db]);

  // Real-time handler for numeric copy input
  const handleCopiesTextChange = (text: string) => {
    const sanitized = text.replace(/[^0-9]/g, "");
    setCopiesInputText(sanitized);
    const parsed = parseInt(sanitized, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setNumberOfCopies(parsed);
    }
  };

  const handleCopiesBlur = () => {
    const parsed = parseInt(copiesInputText, 10);
    if (isNaN(parsed) || parsed < 1) {
      setNumberOfCopies(1);
      setCopiesInputText("1");
    } else {
      setCopiesInputText(String(parsed));
    }
  };

  const decrementCopies = () => {
    if (numberOfCopies > 1) {
      const next = numberOfCopies - 1;
      setNumberOfCopies(next);
      setCopiesInputText(String(next));
    }
  };

  const incrementCopies = () => {
    const next = numberOfCopies + 1;
    setNumberOfCopies(next);
    setCopiesInputText(String(next));
  };

  // Save layout state and proceed to preview
  const handleNext = () => {
    SharedState.packageId = packageId;
    SharedState.idSize = activeIdSize;
    SharedState.paperSize = paperSize;
    SharedState.bgColor = bgColor;
    SharedState.numberOfCopies = selectedPackage.mixed ? 1 : numberOfCopies;
    void persistSharedState();
    router.push("/(services)/preview");
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
        <Text style={styles.headerTitle}>Print Customization</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 1. ID Package Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.title}>1. ID Package</Text>
          <Text style={styles.subtitle}>
            Select package format (Custom Package or Mixed Package)
          </Text>
          <View style={styles.optionsContainer}>
            {ID_PACKAGES.map((pkg) => {
              const isActive = packageId === pkg.id;
              return (
                <TouchableOpacity
                  key={pkg.id}
                  style={[
                    styles.optionCard,
                    isActive && styles.optionCardActive,
                  ]}
                  onPress={() => setPackageId(pkg.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <View
                    style={[
                      styles.optionIconContainer,
                      isActive && styles.optionIconContainerActive,
                    ]}
                  >
                    <Ionicons
                      name={pkg.mixed ? "grid" : "options"}
                      size={22}
                      color={isActive ? "#ffffff" : "#3b74f6"}
                    />
                  </View>
                  <View style={styles.optionBody}>
                    <Text
                      style={[
                        styles.optionTitle,
                        isActive && styles.optionTitleActive,
                      ]}
                    >
                      {pkg.name}
                    </Text>
                    <Text
                      style={[
                        styles.optionMeta,
                        isActive && styles.optionMetaActive,
                      ]}
                    >
                      {pkg.copiesLabel}
                    </Text>
                    <Text
                      style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}
                    >
                      {pkg.description}
                    </Text>
                    {pkg.mixed && (
                      <View style={styles.mixedBadge}>
                        <Text style={styles.mixedBadgeText}>
                          Mixed Sizes (1×1, 2×2, & Passport 35×45mm)
                        </Text>
                      </View>
                    )}
                  </View>
                  {isActive && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#3b74f6"
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Package ID Dimension Selector */}
          {packageId === "custom-package" && (
            <View style={{ marginTop: 14 }}>
              <Text style={[styles.title, { fontSize: 15 }]}>ID sizes</Text>
              <Text style={styles.subtitle}>
                Select sizes for your custom ID layout
              </Text>
              <View style={[styles.optionsContainer, { marginTop: 4 }]}>
                {idSizes.map((sizeObj) => (
                  <TouchableOpacity
                    key={sizeObj.name}
                    style={[
                      styles.optionCard,
                      idSize === sizeObj.name && styles.optionCardActive,
                      { paddingVertical: 10 },
                    ]}
                    onPress={() => setIdSize(sizeObj.name)}
                  >
                    <View
                      style={[
                        styles.optionIconContainer,
                        idSize === sizeObj.name &&
                          styles.optionIconContainerActive,
                        { width: 34, height: 34, borderRadius: 17 },
                      ]}
                    >
                      <Ionicons
                        name="person"
                        size={18}
                        color={idSize === sizeObj.name ? "#ffffff" : "#3b74f6"}
                      />
                    </View>
                    <View style={styles.optionBody}>
                      <Text
                        style={[
                          styles.optionTitle,
                          { fontSize: 14 },
                          idSize === sizeObj.name && styles.optionTitleActive,
                        ]}
                      >
                        {sizeObj.name}
                      </Text>
                      <Text style={{ fontSize: 11, color: "#6b7280" }}>
                        {sizeObj.width_mm} × {sizeObj.height_mm} mm ·{" "}
                        {sizeObj.description}
                      </Text>
                    </View>
                    {idSize === sizeObj.name && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color="#3b74f6"
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* 2. Paper Size Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.title}>2. Paper Size</Text>
          <Text style={styles.subtitle}>Select the paper sheet format</Text>
          <View style={styles.optionsContainer}>
            {["A4", "4R", "Letter"].map((size) => {
              const isActive = paperSize === size;
              return (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.optionCard,
                    isActive && styles.optionCardActive,
                  ]}
                  onPress={() => setPaperSize(size)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <View
                    style={[
                      styles.optionIconContainer,
                      isActive && styles.optionIconContainerActive,
                    ]}
                  >
                    <Ionicons
                      name="document-outline"
                      size={22}
                      color={isActive ? "#ffffff" : "#3b74f6"}
                    />
                  </View>
                  <Text
                    style={[
                      styles.optionTitle,
                      isActive && styles.optionTitleActive,
                    ]}
                  >
                    {size}
                  </Text>
                  {isActive && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#3b74f6"
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. Number of Copies Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.title}>3. Number of Copies</Text>
          {selectedPackage.mixed ? (
            <View style={styles.copiesCard}>
              <View style={styles.copiesLabelContainer}>
                <Text style={styles.copiesLabelText}>
                  Automatic Mixed Layout
                </Text>
                <Text style={styles.copiesHintText}>
                  Includes 2×2" (2 pcs), Passport 35×45mm (4 pcs), and 1×1" (5
                  pcs) — 11 photos total on 1 sheet.
                </Text>
              </View>
              <Ionicons name="sparkles" size={24} color="#3b74f6" />
            </View>
          ) : (
            <>
              <Text style={styles.subtitle}>
                Enter how many ID copies you want to print on the selected paper
                size
              </Text>
              <View style={styles.copiesCard}>
                <View style={styles.copiesLabelContainer}>
                  <Text style={styles.copiesLabelText}>ID Copies</Text>
                  <Text style={styles.copiesHintText}>
                    {numberOfCopies} {numberOfCopies === 1 ? "ID" : "IDs"}{" "}
                    requested
                  </Text>
                </View>

                <View style={styles.copiesInputContainer}>
                  <TouchableOpacity
                    style={[
                      styles.copiesButton,
                      numberOfCopies <= 1 && styles.copiesButtonDisabled,
                    ]}
                    onPress={decrementCopies}
                    disabled={numberOfCopies <= 1}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease copies"
                  >
                    <Ionicons
                      name="remove"
                      size={20}
                      color={numberOfCopies <= 1 ? "#9ca3af" : "#2563eb"}
                    />
                  </TouchableOpacity>

                  <TextInput
                    style={styles.copiesInput}
                    value={copiesInputText}
                    onChangeText={handleCopiesTextChange}
                    onBlur={handleCopiesBlur}
                    keyboardType="number-pad"
                    maxLength={3}
                    selectTextOnFocus
                    accessibilityLabel="Number of copies input"
                  />

                  <TouchableOpacity
                    style={styles.copiesButton}
                    onPress={incrementCopies}
                    accessibilityRole="button"
                    accessibilityLabel="Increase copies"
                  >
                    <Ionicons name="add" size={20} color="#2563eb" />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>

        {/* 4. Layout Preview and Customization Options */}
        <View style={styles.sectionContainer}>
          <Text style={styles.title}>4. Layout Preview</Text>
          <Text style={styles.subtitle}>
            Real-time layout arrangement on selected paper size
          </Text>

          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Sheet Arrangement</Text>

            {SharedState.imageUri && (
              <View style={styles.sourcePreviewRow}>
                <Image
                  source={{ uri: SharedState.imageUri }}
                  style={styles.sourcePreviewPhoto}
                  resizeMode="cover"
                  fadeDuration={0}
                />
                <View style={styles.sourcePreviewText}>
                  <Text style={styles.sourcePreviewTitle}>Selected photo</Text>
                  <Text style={styles.sourcePreviewHint}>
                    Original orientation & natural appearance preserved.
                  </Text>
                </View>
              </View>
            )}

            <PhotoSheet
              imageUri={SharedState.imageUri}
              plan={layoutPlan}
              backgroundColor={previewBackground}
              maxCopies={
                selectedPackage.mixed ? layoutPlan.copies : numberOfCopies
              }
            />

            <Text style={styles.previewCaption}>
              {selectedPackage.mixed
                ? `Mixed Package · 1×1, 2×2, & Passport 35×45mm photos (11 photos total on ${paperSize})`
                : `Custom ${idSize} (${photoWidthMm} × ${photoHeightMm} mm) · ${numberOfCopies} ${numberOfCopies === 1 ? "ID" : "IDs"} on ${paperSize}`}
            </Text>
            <Text style={styles.previewHint}>
              Preview updates automatically in real time when options change.
            </Text>
          </View>

          <Text style={[styles.title, { fontSize: 16, marginTop: 8 }]}>
            Background Color
          </Text>
          <View style={styles.colorGrid}>
            {["White", "Blue", "Red", "Transparent"].map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorChip,
                  bgColor === color && styles.colorChipActive,
                ]}
                onPress={() => setBgColor(color)}
              >
                <Text
                  style={[
                    styles.colorText,
                    bgColor === color && styles.colorTextActive,
                  ]}
                >
                  {color}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.generateButton} onPress={handleNext}>
          <Ionicons
            name="grid-outline"
            size={20}
            color="#ffffff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.generateButtonText}>Generate Layout</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
