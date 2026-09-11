import { StyleSheet } from 'react-native';

// Styles: paper preview and layout-selection controls.
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  previewCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  sourcePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sourcePreviewPhoto: {
    width: 64,
    height: 78,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  sourcePreviewText: {
    flex: 1,
    marginLeft: 12,
  },
  sourcePreviewTitle: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '700',
  },
  sourcePreviewHint: {
    marginTop: 4,
    color: '#6b7280',
    fontSize: 12,
    lineHeight: 17,
  },
  paperPreview: {
    width: '100%',
    borderRadius: 8,
    padding: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  previewGrid: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    justifyContent: 'center',
  },
  previewPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 3,
  },
  previewCaption: {
    marginTop: 10,
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
  },
  previewHint: {
    marginTop: 4,
    color: '#9ca3af',
    fontSize: 11,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  optionCardActive: {
    borderColor: '#3b74f6',
    backgroundColor: '#eff6ff',
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionIconContainerActive: {
    backgroundColor: '#3b74f6',
  },
  optionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  optionTitleActive: {
    color: '#111827',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
    marginTop: 12,
  },
  colorChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  colorChipActive: {
    borderColor: '#3b74f6',
    backgroundColor: '#eff6ff',
  },
  colorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  colorTextActive: {
    color: '#3b74f6',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 26,
    backgroundColor: '#3b74f6',
    marginTop: 16,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default styles;
