import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase/config';
import styles from '../../styles/tabs/profile.styles';

export default function ProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  const handleLogout = async () => {
    try {
      await signOut(auth);
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
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="#9ca3af" />
          </View>
          <Text style={styles.profileName}>{user?.displayName || 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'user@email.com'}</Text>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem}>
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
