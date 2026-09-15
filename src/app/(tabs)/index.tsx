import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../../firebase/config";
import { persistSharedState, SharedState } from "../../SharedState";
import { useDatabase } from "../../database/DatabaseProvider";
import { getLayouts, SavedLayout } from "../../database/queries";
import styles from "../../styles/tabs/index.styles";

export default function DashboardScreen() {
  const router = useRouter();
  const db = useDatabase();
  const user = auth.currentUser;
  const { width } = useWindowDimensions();
  const horizontalPadding = Math.max(16, Math.min(24, width * 0.06));
  const greetingSize = width < 360 ? 24 : width < 420 ? 28 : 30;

  const [recentLayouts, setRecentLayouts] = useState<SavedLayout[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        getLayouts(db, user.uid).then((layouts) => {
          setRecentLayouts(layouts.slice(0, 5));
        });
      }
    }, [db, user?.uid]),
  );

  const handleUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      SharedState.imageUri = result.assets[0].uri;
      await persistSharedState();
      router.push("/(services)/editor");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={[styles.container, { paddingHorizontal: horizontalPadding }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image
            source={require("../../../assets/images/idali-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.greetingContainer}>
          <Text
            style={[styles.greeting, { fontSize: greetingSize }]}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            Hello, {user?.displayName || "there"}!
          </Text>
          <Text style={styles.subtitle}>
            Let's prepare your ID photos today
          </Text>
        </View>

        <View style={[styles.section, styles.idPhotoCard]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>New ID Photo</Text>
              <Text style={styles.sectionSubtitle}>
                Auto background removal & official sizing
              </Text>
            </View>
          </View>

          <View style={styles.servicesGrid}>
            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => router.push("/(services)/capture")}
            >
              <View style={styles.serviceIconContainer}>
                <Ionicons name="camera-outline" size={32} color="#3b74f6" />
              </View>
              <Text style={styles.serviceTitle}>Capture Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.serviceCard} onPress={handleUpload}>
              <View style={styles.serviceIconContainer}>
                <Ionicons name="image-outline" size={32} color="#3b74f6" />
              </View>
              <Text style={styles.serviceTitle}>Upload Photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {recentLayouts.length > 0 && (
          <View style={[styles.section, { marginTop: 32 }]}>
            <View
              style={[
                styles.sectionHeader,
                {
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                },
              ]}
            >
              <Text style={styles.sectionTitle}>Recent Layouts</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/history")}>
                <Text style={{ color: "#3b74f6", fontWeight: "600" }}>
                  See All
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ overflow: "visible" }}
            >
              {recentLayouts.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={{ marginRight: 16, width: 140 }}
                  onPress={() =>
                    router.push(`/(services)/saved-layout?id=${item.id}`)
                  }
                >
                  <View
                    style={{
                      width: 140,
                      height: 160,
                      backgroundColor: "#f3f4f6",
                      borderRadius: 12,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                    }}
                  >
                    <Image
                      source={{ uri: item.layout_uri || item.photo_uri }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  </View>
                  <Text
                    style={{
                      marginTop: 8,
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#111827",
                    }}
                    numberOfLines={1}
                  >
                    {item.id_size}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#6b7280" }}>
                    {item.paper_size}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
