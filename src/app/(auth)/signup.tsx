import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../../firebase/config";
import { googleClientIds, signInWithApple, signInWithGoogleToken } from "../../services/socialAuth";
import {
  firebaseAuthMessage,
  normalizeEmail,
  validateSignup,
  type FieldErrors,
} from "../../services/authValidation";
import styles from "../../styles/auth/signup.styles";

WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
  const router = useRouter();
  const [agree, setAgree] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [socialLoading, setSocialLoading] = useState(false);
  const [googleRequest, googleResponse, promptGoogle] = Google.useIdTokenAuthRequest({
    webClientId: googleClientIds.web,
    androidClientId: googleClientIds.android,
    iosClientId: googleClientIds.ios,
    selectAccount: true,
  });

  useEffect(() => {
    if (!googleResponse) return;
    if (googleResponse.type === "cancel" || googleResponse.type === "dismiss") { setErrors({ login: "Google authentication was cancelled." }); setSocialLoading(false); return; }
    if (googleResponse.type === "error") { setErrors({ login: "Google authentication could not be completed." }); setSocialLoading(false); return; }
    if (googleResponse.type !== "success") { setSocialLoading(false); return; }
    const idToken = googleResponse.params.id_token;
    if (!idToken) { setErrors({ login: "Google did not return a valid identity token." }); setSocialLoading(false); return; }
    void (async () => {
      try { await signInWithGoogleToken(idToken); router.replace("/(tabs)"); }
      catch (authError) { setErrors({ login: firebaseAuthMessage(authError, "signup") }); }
      finally { setSocialLoading(false); }
    })();
  }, [googleResponse, router]);
  const handleSignup = async () => {
    const nextErrors = validateSignup({
      fullName,
      email,
      password,
      confirmPassword,
    });
    if (!agree)
      nextErrors.login = "Accept the Terms & Privacy Policy to continue.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        normalizeEmail(email),
        password,
      );
      await updateProfile(userCredential.user, {
        displayName: fullName.trim(),
      });
      await sendEmailVerification(userCredential.user);
      router.replace("/(tabs)");
    } catch (authError) {
      setErrors({ login: firebaseAuthMessage(authError, "signup") });
    } finally {
      setLoading(false);
    }
  };
  const handleGoogle = async () => {
    setErrors({});
    if (!googleClientIds.isConfigured) { setErrors({ login: "Google Sign In is not configured for this build." }); return; }
    if (!googleRequest) { setErrors({ login: "Google Sign In is still loading. Please try again." }); return; }
    setSocialLoading(true);
    try { await promptGoogle(); } catch (authError) { setErrors({ login: firebaseAuthMessage(authError, "signup") }); setSocialLoading(false); }
  };
  const handleApple = async () => {
    setErrors({}); setSocialLoading(true);
    try { const result = await signInWithApple(); if (fullName.trim() && !result.user.displayName) await updateProfile(result.user, { displayName: fullName.trim() }); router.replace("/(tabs)"); }
    catch (authError) { setErrors({ login: firebaseAuthMessage(authError, "signup") }); }
    finally { setSocialLoading(false); }
  };
  const field = (
    label: string,
    value: string,
    onChangeText: (value: string) => void,
    errorKey: keyof FieldErrors,
    placeholder: string,
    secureTextEntry = false,
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          errors[errorKey] && styles.inputWrapperError,
        ]}
      >
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          autoCapitalize={errorKey === "email" ? "none" : "words"}
          autoCorrect={false}
          keyboardType={errorKey === "email" ? "email-address" : "default"}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword((value) => !value)}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#9ca3af"
              style={styles.inputIcon}
            />
          </TouchableOpacity>
        )}
      </View>
      {!!errors[errorKey] && (
        <Text style={styles.errorText}>{errors[errorKey]}</Text>
      )}
    </View>
  );
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Image
              source={require("../../../assets/images/idali-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Create your Account</Text>
          <Text style={styles.subtitle}>
            Use your email to create one secure IDali account
          </Text>
          {field("Full Name", fullName, setFullName, "fullName", "John Doe")}
          {field(
            "Email Address",
            email,
            setEmail,
            "email",
            "johndoe@email.com",
          )}
          {field(
            "Password",
            password,
            setPassword,
            "password",
            "At least 8 characters",
            !showPassword,
          )}
          {field(
            "Confirm Password",
            confirmPassword,
            setConfirmPassword,
            "confirmPassword",
            "Re-enter your password",
            !showPassword,
          )}
          <Text style={styles.passwordHint}>
            Password must contain at least 8 characters, one letter, and one
            number.
          </Text>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setAgree((value) => !value)}
          >
            <View style={[styles.checkbox, agree && styles.checkboxChecked]}>
              {agree && <Ionicons name="checkmark" size={16} color="white" />}
            </View>
            <Text style={styles.checkboxLabel}>
              I accept the Terms & Privacy Policy
            </Text>
          </TouchableOpacity>
          {!!errors.login && (
            <Text style={styles.errorText}>{errors.login}</Text>
          )}
          <TouchableOpacity
            style={styles.signupButton}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.signupButtonText}>Sign Up</Text>
            )}
          </TouchableOpacity>
          <View style={styles.dividerContainer}><View style={styles.divider} /><Text style={styles.dividerText}>Or continue with</Text><View style={styles.divider} /></View>
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton} onPress={handleGoogle} disabled={loading || socialLoading}><Ionicons name="logo-google" size={20} color="#EA4335" /><Text style={styles.socialButtonText}>Continue with Google</Text></TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} onPress={handleApple} disabled={loading || socialLoading}><Ionicons name="logo-apple" size={20} color="#111827" /><Text style={styles.socialButtonText}>Continue with Apple</Text></TouchableOpacity>
          </View>
          <View style={styles.socialNotice}>
            <Ionicons name="lock-closed-outline" size={20} color="#3b74f6" />
            <Text style={styles.socialNoticeText}>
              Social sign-in uses the same Firebase account system and will
              link to an existing IDali account when appropriate.
            </Text>
          </View>
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text style={styles.footerLink}>Log In</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
