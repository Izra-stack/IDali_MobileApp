import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { updateProfile } from 'firebase/auth';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { app, auth } from '../../../firebase/config';
import { clearSharedState } from '../../SharedState';
import { useEffect, useState } from 'react';
import styles from '../../styles/tabs/profile.styles';

export default function ProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const [profilePhotoUri, setProfilePhotoUri] = useState(user?.photoURL ?? null);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Effect: restore the device-local fallback photo for this account.
  useEffect(() => {
    let mounted = true;
    if (user) {
      AsyncStorage.getItem(`idali.profilePhoto.${user.uid}`).then(savedUri => {
        if (mounted && savedUri && !user.photoURL) setProfilePhotoUri(savedUri);
      });
    }
    return () => { mounted = false; };
  }, [user]);

  // API/event handler: choose, save, and optionally sync a profile picture.
  const handleChooseProfilePhoto = async () => {
    if (!user || photoUploading) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo permission needed', 'Allow photo access to choose a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    // Conditional: stop when the picker is cancelled or returns no asset.
    if (result.canceled || !result.assets?.[0]?.uri) return;

    setPhotoUploading(true);
    try {
      const localUri = result.assets[0].uri;
      setProfilePhotoUri(localUri);
      await AsyncStorage.setItem(`idali.profilePhoto.${user.uid}`, localUri);
      const imageFile = new File(localUri);
      const storage = getStorage(app);
      const profileRef = ref(storage, `profilePictures/${user.uid}/avatar.jpg`);
      await uploadBytes(profileRef, imageFile, { contentType: result.assets[0].mimeType ?? 'image/jpeg' });
      const downloadURL = await getDownloadURL(profileRef);
      await updateProfile(user, { photoURL: downloadURL });
      const refreshedDownloadURL = `${downloadURL}&updated=${Date.now()}`;
      setProfilePhotoUri(refreshedDownloadURL);
      await AsyncStorage.setItem(`idali.profilePhoto.${user.uid}`, refreshedDownloadURL);
    } catch (error) {
      Alert.alert('Profile picture saved', 'The picture was saved on this device. Cloud sync is not available yet.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await clearSharedState();
      router.replace('/(auth)/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to log out');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleChooseProfilePhoto} disabled={photoUploading} accessibilityLabel="Change profile picture">
            {profilePhotoUri ? (
              <Image source={{ uri: profilePhotoUri }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={40} color="#9ca3af" />
            )}
            <View style={styles.avatarEditButton}>
              {photoUploading ? <ActivityIndicator size="small" color="#ffffff" /> : <Ionicons name="camera" size={15} color="#ffffff" />}
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleChooseProfilePhoto} disabled={photoUploading}>
            <Text style={styles.changePhotoText}>{photoUploading ? 'Uploading…' : 'Change profile picture'}</Text>
          </TouchableOpacity>
          <Text style={styles.profileName}>{user?.displayName || 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'user@email.com'}</Text>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Account', 'Account editing is not available yet.') }>
            <View style={styles.menuIconContainer}>
              <Ionicons name="person-outline" size={20} color="#374151" />
            </View>
            <Text style={styles.menuText}>Account</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItemLogout} onPress={handleLogout}>
            <View style={[styles.menuIconContainer, styles.menuIconLogoutContainer]}>
              <Ionicons name="log-out-outline" size={20} color="#dc2626" />
            </View>
            <Text style={styles.menuTextLogout}>Log Out</Text>
          </TouchableOpacity>
        </View>
        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
}
