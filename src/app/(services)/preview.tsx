import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SharedState } from '../../SharedState';
import { useDatabase } from '../../database/DatabaseProvider';
import { auth } from '../../../firebase/config';
import { getLayoutPlan, saveLayout } from '../../database/queries';
import styles from '../../styles/services/preview.styles';

export default function PreviewScreen() {
  const router = useRouter();
  const db = useDatabase();
  
  const imageUri = SharedState.imageUri;
  const idSize = SharedState.idSize;
  const paperSize = SharedState.paperSize;
  const bgColor = SharedState.bgColor;
  // Derived data: use the same print calculation as Layout Settings.
  const plan = getLayoutPlan(idSize || '2x2', paperSize || 'A4');
  const previewCopies = Math.min(plan.copies, 60);
  const photoWidthPercent = `${(plan.photoWidth / plan.paperWidth) * 100}%` as `${number}%`;
  const photoGapPercent = `${(3 / plan.paperWidth) * 100}%` as `${number}%`;

  // Event handler: save the current layout metadata to SQLite.
  const handleSave = async () => {
    if (!imageUri || !auth.currentUser) {
      Alert.alert('Unable to save', 'Please select an image and sign in again.');
      return;
    }
    try {
      await saveLayout(db, {
        user_id: auth.currentUser.uid,
        photo_uri: imageUri,
        id_size: idSize || '2x2',
        paper_size: paperSize || 'A4',
        background_color: bgColor || 'White',
        layout_uri: null,
      });
      Alert.alert('Saved', 'Your layout was added to History.');
    } catch {
      Alert.alert('Save failed', 'The layout could not be saved locally.');
    }
  };

  // Event handler: share the selected source image and layout details.
  const handleExport = async () => {
    if (!imageUri) {
      Alert.alert('Unable to export', 'No image is available to export.');
      return;
    }
    await Share.share({
      url: imageUri,
      message: `IDali layout: ${idSize || '2x2'} on ${paperSize || 'A4'}`,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Layout Preview</Text>
        <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/(tabs)')}>
          <Ionicons name="home-outline" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.resultCard}>
          <View style={styles.successHeader}>
            <Ionicons name="checkmark-circle" size={28} color="#166534" style={{marginRight: 8}} />
            <Text style={styles.resultTitle}>Layout Generated</Text>
          </View>
          
          <View style={[styles.resultImagePlaceholder, { backgroundColor: bgColor === 'Blue' ? '#eff6ff' : bgColor === 'Red' ? '#fef2f2' : '#f3f4f6', aspectRatio: plan.paperWidth / plan.paperHeight }]}>
            {imageUri ? (
              <View style={styles.previewGrid}>
                {/* Loop: render each print position in the calculated grid. */}
                {Array.from({ length: previewCopies }, (_, index) => (
                  <View key={index} style={{ width: photoWidthPercent, aspectRatio: plan.photoWidth / plan.photoHeight, marginRight: photoGapPercent, marginBottom: photoGapPercent }}>
                    <Image source={{ uri: imageUri }} style={styles.previewPhoto} resizeMode="cover" resizeMethod="scale" fadeDuration={0} />
                  </View>
                ))}
              </View>
            ) : (
              <Ionicons name="grid-outline" size={60} color="#d1d5db" />
            )}
            <Text style={styles.noImageText}>Preview ({plan.columns} × {plan.rows} · {plan.copies} photos)</Text>
          </View>
          
          <View style={styles.resultButtons}>
            <TouchableOpacity style={styles.retryButton} onPress={handleSave}>
              <Ionicons name="save-outline" size={20} color="#3b74f6" style={{marginRight: 6}} />
              <Text style={styles.retryButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.continueButton} onPress={handleExport}>
              <Ionicons name="share-outline" size={20} color="#ffffff" style={{marginRight: 6}} />
              <Text style={styles.continueButtonText}>Export</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
