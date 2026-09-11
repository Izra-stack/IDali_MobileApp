import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../../../firebase/config';
import { persistSharedState, SharedState } from '../../SharedState';
import styles from '../../styles/tabs/index.styles';

// Screen: dashboard entry point for capture and gallery workflows.
export default function DashboardScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  // API/event handler: pick a source image and open the editor.
  const handleUpload = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      SharedState.imageUri = result.assets[0].uri;
      await persistSharedState();
      router.push('/(services)/editor');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image 
            source={require('../../../assets/images/idali-logo.png')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
        </View>

        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>Hello, {user?.displayName || 'there'}!</Text>
          <Text style={styles.subtitle}>Let's prepare your ID photos today</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Start New Layout</Text>
          </View>

          <View style={styles.servicesGrid}>
            <TouchableOpacity style={styles.serviceCard} onPress={() => router.push('/(services)/capture')}>
              <View style={styles.serviceIconContainer}>
                <Ionicons name="camera-outline" size={32} color="#3b74f6" />
              </View>
              <Text style={styles.serviceTitle}>Capture Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.serviceCard} onPress={handleUpload}>
              <View style={styles.serviceIconContainer}>
                <Ionicons name="image-outline" size={32} color="#3b74f6" />
              </View>
              <Text style={styles.serviceTitle}>Upload Photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
}
