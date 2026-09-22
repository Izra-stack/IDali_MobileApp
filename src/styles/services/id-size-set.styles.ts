import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  content: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  introCard: { padding: 18, borderRadius: 18, backgroundColor: '#eff6ff', marginBottom: 24 },
  introTitle: { fontSize: 20, fontWeight: '800', color: '#1e3a8a' },
  introText: { color: '#1d4ed8', fontSize: 13, lineHeight: 19, marginTop: 6 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 4 },
  sectionText: { fontSize: 13, color: '#6b7280', marginBottom: 14 },
  sizeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  sizeChip: { minWidth: '30%', flexGrow: 1, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 14, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb' },
  sizeChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  sizeChipText: { color: '#374151', fontWeight: '700', fontSize: 13 },
  sizeChipTextActive: { color: '#ffffff' },
  sizeChipSubtext: { color: '#6b7280', fontSize: 11, marginTop: 4 },
  sizeChipSubtextActive: { color: '#dbeafe' },
  packageCard: { backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#e5e7eb', padding: 14, marginBottom: 14, flexDirection: 'row', gap: 14 },
  packageCardActive: { borderColor: '#3b74f6', backgroundColor: '#f8fbff' },
  thumbnail: { width: 88, height: 116, borderRadius: 10, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#d1d5db', overflow: 'hidden', position: 'relative' },
  thumbnailPhoto: { position: 'absolute', backgroundColor: '#93c5fd', borderWidth: 1, borderColor: '#ffffff' },
  packageBody: { flex: 1, minWidth: 0 },
  packageName: { fontSize: 16, fontWeight: '800', color: '#111827' },
  packageMeta: { fontSize: 13, color: '#2563eb', fontWeight: '700', marginTop: 5 },
  packageDescription: { fontSize: 12, color: '#6b7280', lineHeight: 17, marginTop: 4 },
  useButton: { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: '#2563eb' },
  useButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
});

export default styles;
