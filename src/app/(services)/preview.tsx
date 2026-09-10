import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SharedState } from '../../SharedState';
import styles from '../../styles/services/preview.styles';

export default function PreviewScreen() {
  const router = useRouter();
  
  const imageUri = SharedState.imageUri;
  const idSize = SharedState.idSize;
  const paperSize = SharedState.paperSize;
  const bgColor = SharedState.bgColor;

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
          
          <View style={[styles.resultImagePlaceholder, { backgroundColor: bgColor === 'Blue' ? '#eff6ff' : bgColor === 'Red' ? '#fef2f2' : '#f3f4f6' }]}>
            {imageUri ? (
              <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', padding: 10, justifyContent: 'center', alignItems: 'center' }}>
                <Image source={{ uri: imageUri }} style={{ width: 60, height: 60, margin: 4 }} resizeMode="cover" />
                <Image source={{ uri: imageUri }} style={{ width: 60, height: 60, margin: 4 }} resizeMode="cover" />
                <Image source={{ uri: imageUri }} style={{ width: 60, height: 60, margin: 4 }} resizeMode="cover" />
                <Image source={{ uri: imageUri }} style={{ width: 60, height: 60, margin: 4 }} resizeMode="cover" />
              </View>
            ) : (
              <Ionicons name="grid-outline" size={60} color="#d1d5db" />
            )}
            <Text style={styles.noImageText}>Preview ({idSize || '2x2'} on {paperSize || 'A4'})</Text>
          </View>
          
          <View style={styles.resultButtons}>
            <TouchableOpacity style={styles.retryButton} onPress={() => router.replace('/(tabs)')}>
              <Ionicons name="save-outline" size={20} color="#3b74f6" style={{marginRight: 6}} />
              <Text style={styles.retryButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.continueButton}>
              <Ionicons name="share-outline" size={20} color="#ffffff" style={{marginRight: 6}} />
              <Text style={styles.continueButtonText}>Export</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
