import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../../firebase/config";
import { signInWithApple, signInWithGoogleToken, googleClientIds, getAuthCode, linkPendingCredential } from "../../services/socialAuth";
import {
  firebaseAuthMessage,
  normalizeEmail,
} from "../../services/authValidation";
import styles from "../../styles/auth/login.styles";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [socialLoading, setSocialLoading] = useState(false);
  const [googleRequest, googleResponse, promptGoogle] = Google.useIdTokenAuthRequest({
    webClientId: googleClientIds.web,
    androidClientId: googleClientIds.android,
    iosClientId: googleClientIds.ios,
    selectAccount: true,
  });

  useEffect(() => {
    if (!googleResponse) return;
    if (googleResponse.type === "cancel" || googleResponse.type === "dismiss") {
      setError("Google authentication was cancelled."); setSocialLoading(false); return;
    }
    if (googleResponse.type === "error") {
      setError("Google authentication could not be completed."); setSocialLoading(false); return;
    }
    if (googleResponse.type !== "success") { setSocialLoading(false); return; }
    const idToken = googleResponse.params.id_token;
    if (!idToken) { setError("Google did not return a valid identity token."); setSocialLoading(false); return; }
    void (async () => {
      try { await signInWithGoogleToken(idToken); router.replace("/(tabs)"); }
      catch (authError) { setError(firebaseAuthMessage(authError, "login")); }
      finally { setSocialLoading(false); }
    })();
  }, [googleResponse, router]);
  const handleLogin = async () => {
    setError("");
    setResetMessage("");
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password) {
      setError("Enter your email address and password.");
      return;
    }
    setLoading(true);
    try {
      const credentialResult = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      await linkPendingCredential(credentialResult.user);
      router.replace("/(tabs)");
    } catch (authError) {
      setError(firebaseAuthMessage(authError, "login"));
    } finally {
      setLoading(false);
    }
  };
  const handleGoogle = async () => {
    setError("");
    if (!googleClientIds.web && !googleClientIds.android && !googleClientIds.ios) { setError("Google Sign In is not configured for this build."); return; }
    if (!googleRequest) { setError("Google Sign In is still loading. Please try again."); return; }
    setSocialLoading(true);
    try { await promptGoogle(); } catch (authError) { setError(firebaseAuthMessage(authError, "login")); setSocialLoading(false); }
  };
  const handleApple = async () => {
    setError(""); setSocialLoading(true);
    try { await signInWithApple(); router.replace("/(tabs)"); }
    catch (authError) { setError(firebaseAuthMessage(authError, "login")); }
    finally { setSocialLoading(false); }
  };
  const handlePasswordReset = async () => {
    setError("");
    setResetMessage("");
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      setError("Enter your email address first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, normalizedEmail);
      setResetMessage("Password reset instructions sent. Check your email.");
    } catch (authError) {
      setError(firebaseAuthMessage(authError, "login"));
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../../assets/images/idali-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>WELCOME BACK</Text>
          <Text style={styles.subtitle}>Log in with your IDali account</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="johndoe@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((value) => !value)}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#9ca3af"
                  style={styles.inputIcon}
                />
              </TouchableOpacity>
            </View>
          </View>
          {!!error && <Text style={styles.errorText}>{error}</Text>}
          {!!resetMessage && (
            <Text style={styles.successText}>{resetMessage}</Text>
          )}
          <TouchableOpacity
            onPress={handlePasswordReset}
            style={{ alignSelf: "flex-end", marginTop: 8 }}
          >
            <Text style={styles.footerLink}>Forgot password?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </TouchableOpacity>
          <View style={styles.dividerContainer}><View style={styles.divider} /><Text style={styles.dividerText}>Or continue with</Text><View style={styles.divider} /></View>
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton} onPress={handleGoogle} disabled={loading || socialLoading}><Ionicons name="logo-google" size={20} color="#EA4335" /><Text style={styles.socialButtonText}>Continue with Google</Text></TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} onPress={handleApple} disabled={loading || socialLoading}><Ionicons name="logo-apple" size={20} color="#111827" /><Text style={styles.socialButtonText}>Continue with Apple</Text></TouchableOpacity>
          </View>
          <View style={styles.socialNotice}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color="#3b74f6"
            />
            <Text style={styles.socialNoticeText}>
              Sign in with your IDali email to keep one account per email
              address.
            </Text>
          </View>
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
