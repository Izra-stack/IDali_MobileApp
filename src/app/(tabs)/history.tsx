import { View, Text, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

export default function HistoryScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
      </View>
      <View style={styles.emptyContainer}>
        <Ionicons name="time-outline" size={64} color="#d1d5db" />
        <Text style={styles.emptyText}>No history yet</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 24, paddingBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#111827' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 16, fontSize: 16, color: '#6b7280' }
});
