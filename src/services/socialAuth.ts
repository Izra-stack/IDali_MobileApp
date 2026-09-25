import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import {
  AuthCredential,
  OAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  signInWithCredential,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth } from '../../firebase/config';

let pendingCredential: AuthCredential | null = null;

const rawWeb = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const rawAndroid = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const rawIos = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

export const googleClientIds = {
  web: rawWeb || '',
  android: rawAndroid || rawWeb || '',
  ios: rawIos || rawWeb || '',
  isConfigured: Boolean(rawWeb || rawAndroid || rawIos),
};

export function rememberPendingCredential(credential: AuthCredential) {
  pendingCredential = credential;
}

export async function linkPendingCredential(user: User) {
  if (!pendingCredential) return false;
  const credential = pendingCredential;
  pendingCredential = null;
  await linkWithCredential(user, credential);
  return true;
}

export async function signInWithGoogleToken(idToken: string) {
  const credential = GoogleAuthProvider.credential(idToken);
  try {
    return await signInWithCredential(auth, credential);
  } catch (error) {
    if (getAuthCode(error) === 'auth/account-exists-with-different-credential') rememberPendingCredential(credential);
    throw error;
  }
}

export async function signInWithApple() {
  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) throw { code: 'auth/apple-not-available' };
  const rawNonce = Crypto.randomUUID();
  const nonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
    nonce,
  });
  if (!credential.identityToken) throw { code: 'auth/missing-identity-token' };
  const provider = new OAuthProvider('apple.com');
  const firebaseCredential = provider.credential({ idToken: credential.identityToken, rawNonce });
  try {
    const result = await signInWithCredential(auth, firebaseCredential);
    if (credential.fullName && !result.user.displayName) {
      const displayName = AppleAuthentication.formatFullName(credential.fullName);
      if (displayName) await updateProfile(result.user, { displayName });
    }
    return result;
  } catch (error) {
    if (getAuthCode(error) === 'auth/account-exists-with-different-credential') rememberPendingCredential(firebaseCredential);
    throw error;
  }
}

export function getAuthCode(error: unknown) {
  return typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
}
