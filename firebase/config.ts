import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";

// Your Firebase configuration
// (Replace these with your actual Firebase project credentials)
const firebaseConfig = {
  apiKey: "AIzaSyA5LB73pT-NwdwTv5XnsBC_InvHTkyQ0f0",
  authDomain: "idali-b4049.firebaseapp.com",
  projectId: "idali-b4049",
  storageBucket: "idali-b4049.firebasestorage.app",
  messagingSenderId: "553122675276",
  appId: "1:553122675276:web:9f0f958d8dfd2c94db12e9",
};

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication with React Native AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { app, auth };
