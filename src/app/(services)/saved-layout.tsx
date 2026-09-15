import { View, Text, TouchableOpacity, Image, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useRef } from 'react';
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useDatabase } from '../../database/DatabaseProvider';
import { getLayoutPlan, deleteLayout, SavedLayout } from '../../database/queries';
import { auth } from '../../../firebase/config';
import { PhotoSheet } from '../../components/PhotoSheet';
import styles from '../../styles/services/saved-layout.styles';

export default function SavedLayoutScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const db = useDatabase();
  const [layout, setLayout] = useState<SavedLayout | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);

  useEffect(() => {
    if (id && auth.currentUser) {
      db.getFirstAsync<SavedLayout>('SELECT * FROM layouts WHERE id = ? AND user_id = ?', Number(id), auth.currentUser.uid).then(res => {
        if (res) {
          setLayout(res);
        } else {
          Alert.alert('Error', 'Layout not found.');
          router.back();
        }
      });
    }
  }, [id, db]);

  if (!layout) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#3b74f6" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  const plan = getLayoutPlan(layout.id_size, layout.paper_size);

  const generateHTML = async () => {
    if (!layout || !layout.photo_uri) throw new Error('No layout image URI available');
    let base64Image = '';
    try {
      base64Image = await new File(layout.photo_uri).base64();
    } catch (e) {
      const err = e;
      throw new Error(`Base64 error: ${err && typeof err === 'object' && 'message' in err ? err.message : String(err)}`);
    }
    const imgSrc = `data:image/jpeg;base64,${base64Image}`;
    
    let photosHtml = '';
    const copies = Math.min(plan.copies, plan.columns * plan.rows);
    for (let i = 0; i < copies; i++) {
      const col = i % plan.columns;
      const row = Math.floor(i / plan.columns);
      const left = plan.marginX + col * (plan.photoWidth + plan.gap);
      const top = plan.marginY + row * (plan.photoHeight + plan.gap);
      photosHtml += `
        <div style="position: absolute; left: ${left}mm; top: ${top}mm; width: ${plan.photoWidth}mm; height: ${plan.photoHeight}mm; background-color: white; border: 1px solid #d1d5db; box-sizing: border-box;">
          <img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: contain;" />
        </div>
      `;
    }

    const bg = layout.background_color === 'Blue' ? '#eff6ff' : layout.background_color === 'Red' ? '#fef2f2' : '#f3f4f6';
    return `
      <html>
        <head>
          <style>
            @page { margin: 0; size: ${plan.paperWidth}mm ${plan.paperHeight}mm; }
            body { margin: 0; padding: 0; background-color: ${bg}; width: ${plan.paperWidth}mm; height: ${plan.paperHeight}mm; position: relative; }
          </style>
        </head>
        <body>
          ${photosHtml}
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
        height: plan.paperHeight * pointsPerMm
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
      Alert.alert('Error', `Could not generate PDF: ${err && typeof err === 'object' && 'message' in err ? err.message : String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShareImage = async () => {
    setIsProcessing(true);
    setExportModalVisible(false);
    try {
      if (!layout.layout_uri) throw new Error('No layout image saved.');
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(layout.layout_uri);
      } else {
        Alert.alert('Error', 'Sharing is not available on this device.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not share image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete layout?', 'This saved layout will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (auth.currentUser) {
            await deleteLayout(db, layout.id, auth.currentUser.uid);
            router.back();
          }
        }
      }
    ]);
  };

  const handleReprint = async () => {
    // Reprint logic - maybe just show PDF directly to print, or let them pick Printer?
    setIsProcessing(true);
    try {
      const html = await generateHTML();
      if (!html) throw new Error('HTML generation failed silently');
      
      const pointsPerMm = 72 / 25.4;
      await Print.printAsync({ 
        html,
        width: plan.paperWidth * pointsPerMm,
        height: plan.paperHeight * pointsPerMm
      });
    } catch (e) {
      const err = e;
      Alert.alert('Error', `Could not start printing: ${err && typeof err === 'object' && 'message' in err ? err.message : String(err)}`);
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
        <Text style={styles.headerTitle}>Saved Layout</Text>
        <TouchableOpacity style={styles.homeButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="#dc2626" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.resultCard}>
          {layout.layout_uri ? (
             <Image source={{ uri: layout.layout_uri }} style={{ width: '100%', aspectRatio: plan.paperWidth / plan.paperHeight, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db' }} resizeMode="contain" />
          ) : (
            <PhotoSheet
              imageUri={layout.photo_uri}
              plan={plan}
              backgroundColor={layout.background_color === 'Blue' ? '#eff6ff' : layout.background_color === 'Red' ? '#fef2f2' : '#f3f4f6'}
            />
          )}
          <Text style={styles.noImageText}>{layout.id_size} on {layout.paper_size}</Text>
          
          <View style={styles.resultButtons}>
            <TouchableOpacity style={styles.retryButton} onPress={handleReprint} disabled={isProcessing}>
              {isProcessing ? (
                <ActivityIndicator size="small" color="#3b74f6" />
              ) : (
                <>
                  <Ionicons name="print-outline" size={20} color="#3b74f6" style={{marginRight: 6}} />
                  <Text style={styles.retryButtonText}>Reprint</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.continueButton} onPress={() => setExportModalVisible(true)} disabled={isProcessing}>
              <Ionicons name="share-outline" size={20} color="#ffffff" style={{marginRight: 6}} />
              <Text style={styles.continueButtonText}>Export</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal
        visible={exportModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setExportModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Export Options</Text>
            
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }} onPress={handleExportPDF}>
              <Ionicons name="document-text-outline" size={24} color="#374151" style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 16, color: '#111827' }}>Export as PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }} onPress={handleShareImage}>
              <Ionicons name="share-social-outline" size={24} color="#374151" style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 16, color: '#111827' }}>Share Image</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 16, alignItems: 'center', paddingVertical: 12, backgroundColor: '#f3f4f6', borderRadius: 12 }} onPress={() => setExportModalVisible(false)}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
