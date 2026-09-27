import { applyActionCode, checkActionCode } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../../firebase/config";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; oobCode?: string }>();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const oobCode = params.oobCode;
    if (!oobCode) {
      setStatus("error");
      setErrorMessage("No verification code was provided in the link.");
      return;
    }

    let isMounted = true;

    async function processVerification() {
      try {
        const info = await checkActionCode(auth, oobCode!);
        if (info.data.email) {
          setUserEmail(info.data.email);
        }
        await applyActionCode(auth, oobCode!);
        if (auth.currentUser) {
          await auth.currentUser.reload();
        }
        if (isMounted) {
          setStatus("success");
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        if (isMounted) {
          setStatus("error");
          if (err.code === "auth/invalid-action-code") {
            setErrorMessage("This email verification link has expired or has already been used.");
          } else {
            setErrorMessage(err.message || "Failed to verify email. Please try signing in and requesting a new link.");
          }
        }
      }
    }

    processVerification();

    return () => {
      isMounted = false;
    };
  }, [params.oobCode]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f4f6f8" }}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 480,
            backgroundColor: "#ffffff",
            borderRadius: 20,
            padding: 32,
            alignItems: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            borderWidth: 1,
            borderColor: "#e5e7eb",
          }}
        >
          <Image
            source={require("../../assets/images/idali-logo.png")}
            style={{ width: 140, height: 48, marginBottom: 28 }}
            resizeMode="contain"
          />

          {status === "verifying" && (
            <>
              <ActivityIndicator size="large" color="#3b74f6" style={{ marginBottom: 20 }} />
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: "#111827",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Verifying Your Email...
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#6b7280",
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                Please wait while IDali processes your secure verification token.
              </Text>
            </>
          )}

          {status === "success" && (
            <>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: "#dcfce7",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Ionicons name="checkmark-circle" size={48} color="#16a34a" />
              </View>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: "#111827",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Email Verified Successfully!
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: "#4b5563",
                  textAlign: "center",
                  marginBottom: 24,
                  lineHeight: 22,
                }}
              >
                {userEmail
                  ? `Your email address (${userEmail}) has been confirmed.`
                  : "Your email address has been confirmed."}{" "}
                You can now log in to your IDali account.
              </Text>

              <TouchableOpacity
                onPress={() =>
                  router.replace({
                    pathname: "/(auth)/login",
                    params: { verified: "true" },
                  })
                }
                style={{
                  backgroundColor: "#3b74f6",
                  paddingVertical: 14,
                  paddingHorizontal: 32,
                  borderRadius: 28,
                  width: "100%",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  Return to Login
                </Text>
              </TouchableOpacity>
            </>
          )}

          {status === "error" && (
            <>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: "#fee2e2",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Ionicons name="close-circle" size={48} color="#dc2626" />
              </View>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: "#111827",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Verification Failed
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: "#4b5563",
                  textAlign: "center",
                  marginBottom: 24,
                  lineHeight: 22,
                }}
              >
                {errorMessage}
              </Text>

              <TouchableOpacity
                onPress={() => router.replace("/(auth)/login")}
                style={{
                  backgroundColor: "#3b74f6",
                  paddingVertical: 14,
                  paddingHorizontal: 32,
                  borderRadius: 28,
                  width: "100%",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  Go to Login
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text
          style={{
            marginTop: 32,
            fontSize: 13,
            color: "#9ca3af",
            textAlign: "center",
          }}
        >
          &copy; 2026 IDali. All rights reserved.
        </Text>
      </View>
    </SafeAreaView>
  );
}
