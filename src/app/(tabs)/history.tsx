import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../../firebase/config";
import { useDatabase } from "../../database/DatabaseProvider";
import {
  deleteLayout,
  getLayouts,
  type SavedLayout,
} from "../../database/queries";

export default function HistoryScreen() {
  const router = useRouter();
  const db = useDatabase();
  const [layouts, setLayouts] = useState<SavedLayout[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Function: load the current user's saved layouts from SQLite.
  const loadLayouts = useCallback(async () => {
    if (auth.currentUser)
      setLayouts(await getLayouts(db, auth.currentUser.uid));
  }, [db]);

  // Event handler: refresh the list when the user pulls down.
  const refreshLayouts = async () => {
    setRefreshing(true);
    await loadLayouts();
    setRefreshing(false);
  };

  useEffect(() => {
    loadLayouts();
  }, [db]);

  // Event handler: confirm and delete one saved layout.
  const removeLayout = (id: number) => {
    Alert.alert("Delete layout?", "This saved layout will be removed.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (auth.currentUser) {
            await deleteLayout(db, id, auth.currentUser.uid);
            loadLayouts();
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>History</Text>
          <Text style={styles.headerSubtitle}>Your saved ID photo layouts</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{layouts.length}</Text>
        </View>
      </View>
      {layouts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>No saved layouts yet</Text>
          <Text style={styles.helperText}>
            Create an ID layout and save it to see it here.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push("/(tabs)")}
          >
            <Ionicons name="add" size={18} color="#ffffff" />
            <Text style={styles.emptyButtonText}>Create layout</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={layouts}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={refreshLayouts}
          // Loop: FlatList renders one card for each saved layout.
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.thumbnailFrame}>
                <Image
                  source={{ uri: item.photo_uri }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.details}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.id_size}
                </Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  {item.paper_size} paper
                </Text>
                <View style={styles.metaRow}>
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: item.background_color },
                    ]}
                  />
                  <Text style={styles.cardMeta} numberOfLines={1}>
                    {item.background_color}
                  </Text>
                  <Text style={styles.cardDate}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => removeLayout(item.id)}
                accessibilityLabel="Delete saved layout"
              >
                <Ionicons name="trash-outline" size={20} color="#dc2626" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9fafb" },

  header: {
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: { fontSize: 24, fontWeight: "700", color: "#111827" },
  headerSubtitle: { marginTop: 4, fontSize: 13, color: "#6b7280" },

  countBadge: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { color: "#2563eb", fontWeight: "700" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 36,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  helperText: {
    marginTop: 8,
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: "#3b74f6",
  },
  emptyButtonText: { color: "#ffffff", fontWeight: "600" },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  thumbnailFrame: {
    width: 76,
    height: 88,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
  },
  thumbnail: { width: "100%", height: "100%" },
  details: { flex: 1, marginHorizontal: 14, minWidth: 0 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  cardSubtitle: { marginTop: 5, fontSize: 13, color: "#6b7280" },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    minWidth: 0,
  },
  colorDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#e5e7eb",
    marginRight: 5,
  },
  cardMeta: { flex: 1, fontSize: 11, color: "#9ca3af" },
  cardDate: { marginLeft: 8, fontSize: 11, color: "#9ca3af" },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
  },
});
