import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Print from 'expo-print';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import { auth } from '../../../firebase/config';
import { PhotoSheet } from '../../components/PhotoSheet';
import { useDatabase } from '../../database/DatabaseProvider';
import { getPackagePlan, saveLayout } from '../../database/queries';
import { SharedState } from '../../SharedState';
import styles from '../../styles/services/preview.styles';

export default function PreviewScreen() {
  const router = useRouter();
  const db = useDatabase();
  const offscreenRef = useRef<View>(null);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const imageUri = SharedState.imageUri;
  const idSize = SharedState.idSize;
  const paperSize = SharedState.paperSize;
  const bgColor = SharedState.bgColor;
  const numberOfCopies = Math.max(1, SharedState.numberOfCopies || 1);
  const plan = getPackagePlan(SharedState.packageId, idSize || '2x2 inches', paperSize || 'A4');

  const captureLayoutImage = async () => {
    if (!offscreenRef.current) return null;
    try {
      return await captureRef(offscreenRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handleSave = async () => {
    if (!imageUri || !auth.currentUser) {
      Alert.alert('Unable to save', 'Please select an image and sign in again.');
      return;
    }
    setIsProcessing(true);
    try {
      const uri = await captureLayoutImage();
      let layoutUri = null;
      if (uri) {
        const filename = `layout_${Date.now()}.png`;
        const destFile = new File(Paths.document, filename);
        const sourceFile = new File(uri);
        await sourceFile.copy(destFile);
        layoutUri = destFile.uri;
      }

      await saveLayout(db, {
        user_id: auth.currentUser.uid,
        photo_uri: imageUri,
        id_size: idSize || '2x2',
        paper_size: paperSize || 'A4',
        background_color: bgColor || 'White',
        package_id: SharedState.packageId || 'a4-package',
        layout_uri: layoutUri,
      });
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Save failed', 'The layout could not be saved locally.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateHTML = async () => {
    if (!imageUri) throw new Error('No image URI available');
    let base64Image = '';
    try {
      base64Image = await new File(imageUri).base64();
    } catch (e) {
      const err = e;
      throw new Error(
        `Base64 error: ${err && typeof err === 'object' && 'message' in err ? err.message : String(err)}`,
      );
    }
    const imgSrc = `data:image/jpeg;base64,${base64Image}`;

    let photosHtml = '';
    const slots = (plan.slots ?? []).slice(0, plan.copies);
    for (const slot of slots) {
      const left = slot.left;
      const top = slot.top;
      photosHtml += `
        <div style="position: absolute; left: ${left}mm; top: ${top}mm; width: ${slot.photoWidth}mm; height: ${slot.photoHeight}mm; background-color: white; border: 1px solid #d1d5db; box-sizing: border-box;">
          <img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: contain;" />
        </div>
      `;
    }

    const bg = bgColor === 'Blue' ? '#eff6ff' : bgColor === 'Red' ? '#fef2f2' : '#f3f4f6';
    let pagesHtml = '';
    for (let c = 0; c < numberOfCopies; c += 1) {
      pagesHtml += `
        <div style="width: ${plan.paperWidth}mm; height: ${plan.paperHeight}mm; position: relative; background-color: ${bg}; overflow: hidden; page-break-after: ${c < numberOfCopies - 1 ? 'always' : 'auto'};">
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
    setIsProcessing(true);
    setExportModalVisible(false);
    try {
      const html = await generateHTML();
      if (!html) throw new Error('HTML generation failed silently');

      const pointsPerMm = 72 / 25.4;
      const { uri } = await Print.printToFileAsync({
        html,
        width: plan.paperWidth * pointsPerMm,
        height: plan.paperHeight * pointsPerMm,
      });

      // Move to a readable cache directory for sharing
      const pdfFileName = `IDali_Layout_${Date.now()}.pdf`;
      const destFile = new File(Paths.cache, pdfFileName);
      const sourceFile = new File(uri);
      await sourceFile.copy(destFile);

      if (!destFile.exists) {
        throw new Error('PDF file was not created successfully');
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(destFile.uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      } else {
        Alert.alert('Success', 'PDF generated, but sharing is not available on this device.');
      }
    } catch (e) {
      const err = e;
      Alert.alert(
        'Error',
        `Could not generate PDF: ${err && typeof err === 'object' && 'message' in err ? err.message : String(err)}`,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToGallery = async () => {
    setIsProcessing(true);
    setExportModalVisible(false);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Cannot save image without permission.');
        return;
      }
      const uri = await captureLayoutImage();
      if (!uri) throw new Error('Could not capture image');
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Success', 'Layout saved to gallery!');
    } catch {
      Alert.alert('Error', 'Could not save to gallery.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShareImage = async () => {
    setIsProcessing(true);
    setExportModalVisible(false);
    try {
      const uri = await captureLayoutImage();
      if (!uri) throw new Error('Could not capture image');
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Error', 'Sharing is not available on this device.');
      }
    } catch {
      Alert.alert('Error', 'Could not share image.');
    } finally {
      setIsProcessing(false);
    }
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
            <Ionicons name="checkmark-circle" size={28} color="#166534" style={{ marginRight: 8 }} />
            <Text style={styles.resultTitle}>Layout Generated</Text>
          </View>

          {imageUri ? (
            <PhotoSheet
              imageUri={imageUri}
              plan={plan}
              backgroundColor={
                bgColor === 'Blue' ? '#eff6ff' : bgColor === 'Red' ? '#fef2f2' : '#f3f4f6'
              }
            />
          ) : (
            <View
              style={[
                styles.resultImagePlaceholder,
                { backgroundColor: '#f3f4f6', aspectRatio: plan.paperWidth / plan.paperHeight },
              ]}
            >
              <Ionicons name="grid-outline" size={60} color="#d1d5db" />
            </View>
          )}
          <Text style={styles.noImageText}>
            Preview ({plan.copies} photos/sheet × {numberOfCopies}{' '}
            {numberOfCopies === 1 ? 'copy' : 'copies'} = {plan.copies * numberOfCopies} photos ·{' '}
            {paperSize || 'A4'} ·{' '}
            {SharedState.packageId === 'mixed-package' ? 'Mixed Package' : idSize || 'selected size'}
            )
          </Text>

          <View style={styles.resultButtons}>
            <TouchableOpacity style={styles.retryButton} onPress={handleSave} disabled={isProcessing}>
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
              <Ionicons name="share-outline" size={20} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.continueButtonText}>Export</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={{ position: 'absolute', top: -10000, left: -10000 }}>
        <View ref={offscreenRef} collapsable={false}>
          {imageUri && (
            <PhotoSheet
              imageUri={imageUri}
              plan={plan}
              backgroundColor={
                bgColor === 'Blue' ? '#eff6ff' : bgColor === 'Red' ? '#fef2f2' : '#f3f4f6'
              }
              fixedWidth={plan.paperWidth * 10}
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
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
              Export Options
            </Text>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#f3f4f6',
              }}
              onPress={handleSaveToGallery}
            >
              <Ionicons
                name="image-outline"
                size={24}
                color="#374151"
                style={{ marginRight: 12 }}
              />
              <Text style={{ fontSize: 16, color: '#111827' }}>Save to Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#f3f4f6',
              }}
              onPress={handleExportPDF}
            >
              <Ionicons
                name="document-text-outline"
                size={24}
                color="#374151"
                style={{ marginRight: 12 }}
              />
              <Text style={{ fontSize: 16, color: '#111827' }}>Export as PDF ({numberOfCopies} {numberOfCopies === 1 ? 'page' : 'pages'})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#f3f4f6',
              }}
              onPress={handleShareImage}
            >
              <Ionicons
                name="share-social-outline"
                size={24}
                color="#374151"
                style={{ marginRight: 12 }}
              />
              <Text style={{ fontSize: 16, color: '#111827' }}>Share Image</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                marginTop: 16,
                alignItems: 'center',
                paddingVertical: 12,
                backgroundColor: '#f3f4f6',
                borderRadius: 12,
              }}
              onPress={() => setExportModalVisible(false)}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
