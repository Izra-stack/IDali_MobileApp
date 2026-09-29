import { Ionicons } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  createUserWithEmailAndPassword,
  signOut,
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
import {
  firebaseAuthMessage,
  normalizeEmail,
  validateSignup,
  type FieldErrors,
} from "../../services/authValidation";
import { sendBrandedVerificationEmail } from "../../services/emailVerification";
import {
  googleClientIds,
  signInWithApple,
  signInWithGoogleToken,
} from "../../services/socialAuth";
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [socialLoading, setSocialLoading] = useState(false);
  const [googleRequest, googleResponse, promptGoogle] =
    Google.useIdTokenAuthRequest({
      webClientId: googleClientIds.web,
      androidClientId: googleClientIds.android,
      iosClientId: googleClientIds.ios,
      selectAccount: true,
    });

  useEffect(() => {
    if (!googleResponse) return;
    if (googleResponse.type === "cancel" || googleResponse.type === "dismiss") {
      setErrors({ login: "Google authentication was cancelled." });
      setSocialLoading(false);
      return;
    }
    if (googleResponse.type === "error") {
      setErrors({ login: "Google authentication could not be completed." });
      setSocialLoading(false);
      return;
    }
    if (googleResponse.type !== "success") {
      setSocialLoading(false);
      return;
    }
    const idToken = googleResponse.params.id_token;
    if (!idToken) {
      setErrors({ login: "Google did not return a valid identity token." });
      setSocialLoading(false);
      return;
    }
    void (async () => {
      try {
        await signInWithGoogleToken(idToken);
        router.replace("/(tabs)");
      } catch (authError) {
        setErrors({ login: firebaseAuthMessage(authError, "signup") });
      } finally {
        setSocialLoading(false);
      }
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
      if (auth.currentUser) {
        await signOut(auth);
      }
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        normalizeEmail(email),
        password,
      );

      try {
        await updateProfile(userCredential.user, {
          displayName: fullName.trim(),
        });
      } catch {}

      try {
        await sendBrandedVerificationEmail(userCredential.user);
      } catch {}

      await signOut(auth);

      router.replace({
        pathname: "/(auth)/login",
        params: { registered: "true", email: normalizeEmail(email) },
      });
    } catch (authError) {
      setErrors({ login: firebaseAuthMessage(authError, "signup") });
    } finally {
      setLoading(false);
    }
  };
  const handleGoogle = async () => {
    setErrors({});
    setSocialLoading(true);
    try {
      if (googleRequest) {
        await promptGoogle();
      } else {
        await promptGoogle();
      }
    } catch (authError) {
      setErrors({ login: firebaseAuthMessage(authError, "signup") });
      setSocialLoading(false);
    }
  };
  const handleApple = async () => {
    setErrors({});
    setSocialLoading(true);
    try {
      const result = await signInWithApple();
      if (fullName.trim() && !result.user.displayName)
        await updateProfile(result.user, { displayName: fullName.trim() });
      router.replace("/(tabs)");
    } catch (authError) {
      setErrors({ login: firebaseAuthMessage(authError, "signup") });
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
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
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View
              style={[
                styles.inputWrapper,
                errors.fullName && styles.inputWrapperError,
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
            {!!errors.fullName && (
              <Text style={styles.errorText}>{errors.fullName}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View
              style={[
                styles.inputWrapper,
                errors.email && styles.inputWrapperError,
              ]}
            >
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
            {!!errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View
              style={[
                styles.inputWrapper,
                errors.password && styles.inputWrapperError,
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="At least 8 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={showPassword ? "#2563eb" : "#9ca3af"}
                  style={styles.inputIcon}
                />
              </TouchableOpacity>
            </View>
            {!!errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View
              style={[
                styles.inputWrapper,
                errors.confirmPassword && styles.inputWrapperError,
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword((prev) => !prev)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={showConfirmPassword ? "Hide password" : "Show password"}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={showConfirmPassword ? "#2563eb" : "#9ca3af"}
                  style={styles.inputIcon}
                />
              </TouchableOpacity>
            </View>
            {!!errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>
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
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>Or continue with</Text>
            <View style={styles.divider} />
          </View>
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogle}
              disabled={loading || socialLoading}
            >
              <Ionicons name="logo-google" size={20} color="#EA4335" />
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>
            {Platform.OS === "ios" && (
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleApple}
                disabled={loading || socialLoading}
              >
                <Ionicons name="logo-apple" size={20} color="#111827" />
                <Text style={styles.socialButtonText}>Continue with Apple</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.socialNotice}>
            <Ionicons name="lock-closed-outline" size={20} color="#3b74f6" />
            <Text style={styles.socialNoticeText}>
              Social sign-in uses the same Firebase account system and will link
              to an existing IDali account when appropriate.
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
