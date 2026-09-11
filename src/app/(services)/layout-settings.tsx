import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useDatabase } from '../../database/DatabaseProvider';
import { persistSharedState, SharedState } from '../../SharedState';
import { getLayoutPlan } from '../../database/queries';
import styles from '../../styles/services/layout-settings.styles';

export default function LayoutSettingsScreen() {
  const router = useRouter();
  const db = useDatabase();
  
  const [idSizes, setIdSizes] = useState<{name: string, width_mm: number, height_mm: number}[]>([]);
  const [idSize, setIdSize] = useState(SharedState.idSize);
  const [paperSize, setPaperSize] = useState(SharedState.paperSize);
  const [bgColor, setBgColor] = useState(SharedState.bgColor);
  // Derived data: recalculate the print grid whenever the user's choices change.
  const layoutPlan = getLayoutPlan(idSize, paperSize);
  const previewCount = Math.min(layoutPlan.copies, 60);
  const photoWidthPercent = `${(layoutPlan.photoWidth / layoutPlan.paperWidth) * 100}%` as `${number}%`;
  const photoGapPercent = `${(3 / layoutPlan.paperWidth) * 100}%` as `${number}%`;
  const previewBackground = bgColor === 'Blue' ? '#dbeafe' : bgColor === 'Red' ? '#fee2e2' : bgColor === 'Transparent' ? '#e5e7eb' : '#ffffff';

  // Effect: load ID dimensions from the local database once per screen mount.
  useEffect(() => {
    async function loadSizes() {
      try {
        const result = await db.getAllAsync('SELECT * FROM id_sizes');
        if (result && result.length > 0) {
          setIdSizes(result as any[]);
          const currentSize = (result as any[]).some(size => size.name === SharedState.idSize) ? SharedState.idSize : (result[0] as any).name;
          setIdSize(currentSize);
        } else {
          setIdSizes([
            { name: '1x1', width_mm: 25.4, height_mm: 25.4 },
            { name: '2x2', width_mm: 50.8, height_mm: 50.8 },
            { name: 'Passport Size', width_mm: 35, height_mm: 45 }
          ]);
        }
      } catch (error) {
        console.error("Failed to load sizes from SQLite:", error);
      }
    }
    loadSizes();
  }, []);

  // Event handler: save layout choices before opening the final preview.
  const handleNext = () => {
    SharedState.idSize = idSize;
    SharedState.paperSize = paperSize;
    SharedState.bgColor = bgColor;
    void persistSharedState();
    router.push('/(services)/preview');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Layout Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Your layout preview</Text>
          {SharedState.imageUri && (
            <View style={styles.sourcePreviewRow}>
              <Image source={{ uri: SharedState.imageUri }} style={styles.sourcePreviewPhoto} resizeMode="cover" resizeMethod="scale" fadeDuration={0} />
              <View style={styles.sourcePreviewText}>
                <Text style={styles.sourcePreviewTitle}>Selected photo</Text>
                <Text style={styles.sourcePreviewHint}>This is the photo that will be repeated in the layout.</Text>
              </View>
            </View>
          )}
          <View
            style={[styles.paperPreview, { backgroundColor: previewBackground, aspectRatio: layoutPlan.paperWidth / layoutPlan.paperHeight }]}
          >
            {SharedState.imageUri ? (
              <View style={styles.previewGrid}>
                {Array.from({ length: previewCount }, (_, index) => (
                  <View key={index} style={{ width: photoWidthPercent, aspectRatio: layoutPlan.photoWidth / layoutPlan.photoHeight, marginRight: photoGapPercent, marginBottom: photoGapPercent }}>
                    <Image source={{ uri: SharedState.imageUri }} style={styles.previewPhoto} resizeMode="cover" resizeMethod="scale" fadeDuration={0} />
                  </View>
                ))}
              </View>
            ) : <Ionicons name="image-outline" size={48} color="#9ca3af" />}
          </View>
          <Text style={styles.previewCaption}>{layoutPlan.columns} columns × {layoutPlan.rows} rows · {layoutPlan.copies} photos on {paperSize}</Text>
          <Text style={styles.previewHint}>Preview updates automatically when you change the ID or paper size.</Text>
        </View>

        <Text style={styles.title}>ID Size Selection</Text>
        <Text style={styles.subtitle}>Choose the dimensions for your ID photo</Text>

        <View style={styles.optionsContainer}>
          {/* Conditional + loop: show database sizes or a loading message. */}
          {idSizes.length > 0 ? idSizes.map((sizeObj) => (
            <TouchableOpacity 
              key={sizeObj.name}
              style={[styles.optionCard, idSize === sizeObj.name && styles.optionCardActive]} 
              onPress={() => setIdSize(sizeObj.name)}>
              <View style={[styles.optionIconContainer, idSize === sizeObj.name && styles.optionIconContainerActive]}>
                <Ionicons name="person" size={24} color={idSize === sizeObj.name ? '#ffffff' : '#3b74f6'} />
              </View>
              <View>
                <Text style={[styles.optionTitle, idSize === sizeObj.name && styles.optionTitleActive]}>{sizeObj.name}</Text>
                <Text style={{fontSize: 10, color: idSize === sizeObj.name ? '#dbeafe' : '#9ca3af'}}>{sizeObj.width_mm}x{sizeObj.height_mm}mm</Text>
              </View>
              {idSize === sizeObj.name && <Ionicons name="checkmark-circle" size={24} color="#3b74f6" style={{marginLeft: 'auto'}}/>}
            </TouchableOpacity>
          )) : (
            <Text style={{color: '#9ca3af', padding: 10}}>Loading sizes from database...</Text>
          )}
        </View>

        <Text style={[styles.title, {marginTop: 20}]}>Paper Size Selection</Text>
        <Text style={styles.subtitle}>Select the paper to print your layout</Text>
        <View style={styles.optionsContainer}>
          {/* Loop: render supported paper-size choices. */}
          {['A4', '4R', 'Letter'].map((size) => (
            <TouchableOpacity 
              key={size}
              style={[styles.optionCard, paperSize === size && styles.optionCardActive]} 
              onPress={() => setPaperSize(size)}>
              <View style={[styles.optionIconContainer, paperSize === size && styles.optionIconContainerActive]}>
                <Ionicons name="document-outline" size={24} color={paperSize === size ? '#ffffff' : '#3b74f6'} />
              </View>
              <Text style={[styles.optionTitle, paperSize === size && styles.optionTitleActive]}>{size}</Text>
              {paperSize === size && <Ionicons name="checkmark-circle" size={24} color="#3b74f6" style={{marginLeft: 'auto'}} />}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.title, {marginTop: 20}]}>Background Color</Text>
        <View style={styles.colorGrid}>
          {/* Loop: render supported background-color choices. */}
          {['White', 'Blue', 'Red', 'Transparent'].map((color) => (
            <TouchableOpacity 
              key={color}
              style={[styles.colorChip, bgColor === color && styles.colorChipActive]}
              onPress={() => setBgColor(color)}
            >
              <Text style={[styles.colorText, bgColor === color && styles.colorTextActive]}>{color}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.generateButton} onPress={handleNext}>
          <Ionicons name="grid-outline" size={20} color="#ffffff" style={{marginRight: 8}} />
          <Text style={styles.generateButtonText}>Generate Layout</Text>
        </TouchableOpacity>
        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
}
