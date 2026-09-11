import { getApp, getApps, initializeApp } from 'firebase/app';
import { initializeAuth, getAuth, type Auth } from 'firebase/auth';
import { getReactNativePersistence } from '@firebase/auth/dist/rn/index.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyA5LB73pT-NwdwTv5XnsBC_InvHTkyQ0f0',
  authDomain: 'idali-b4049.firebaseapp.com',
  projectId: 'idali-b4049',
  storageBucket: 'idali-b4049.firebasestorage.app',
  messagingSenderId: '553122675276',
  appId: '1:553122675276:web:9f0f958d8dfd2c94db12e9',
};

// Initialization: reuse the existing app during development reloads.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
let auth: Auth;

// Initialization: keep authentication persistent on native devices.
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

export { app, auth };
