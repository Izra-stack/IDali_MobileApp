import { View, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../firebase/config';
import styles from '../styles/index.styles';
import { hydrateSharedState } from '../SharedState';

export default function SplashScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  // Effect: wait for Firebase and draft hydration before enabling Continue.
  useEffect(() => {
    let mounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      await hydrateSharedState();
      if (!mounted) return;
      setUser(user);
      setReady(true);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Event handler: send the user to the correct authenticated route.
  const continueToApp = () => {
    router.replace(user ? '/(tabs)' : '/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/images/idali-logo.png')} 
        style={styles.logo} 
        resizeMode="contain" 
      />
      <Text style={styles.welcomeText}>Your photo ID, made simple.</Text>
      <TouchableOpacity style={[styles.continueButton, !ready && styles.continueButtonDisabled]} onPress={continueToApp} disabled={!ready} activeOpacity={0.85}>
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}
