import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { SharedState } from '../../SharedState';
import styles from '../../styles/tabs/edit.styles';

export default function EditTabScreen() {
  const router = useRouter();

  const handleUpload = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      SharedState.imageUri = result.assets[0].uri;
      router.push('/(services)/editor');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Edit</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Select Photo to Edit</Text>
        <Text style={styles.subtitle}>Choose a photo to start editing</Text>

        <TouchableOpacity style={styles.uploadCard} onPress={handleUpload}>
          <View style={styles.uploadIconContainer}>
            <Ionicons name="cloud-upload-outline" size={32} color="#3b74f6" />
          </View>
          <Text style={styles.uploadTitle}>Upload from Gallery</Text>
        </TouchableOpacity>

        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
}
