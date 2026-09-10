import { View, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/config';
import styles from '../styles/index.styles';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setTimeout(() => {
        if (user) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/login');
        }
      }, 1500);
    });

    return unsubscribe;
  }, []);

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/images/idali-logo.png')} 
        style={styles.logo} 
        resizeMode="contain" 
      />
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading ...</Text>
      </View>
    </View>
  );
}
