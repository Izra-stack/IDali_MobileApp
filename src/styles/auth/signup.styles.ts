import { StyleSheet } from 'react-native';

// Styles: signup form layout and account creation actions.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    height: 52,
  },
  inputWrapperError: {
    borderColor: '#dc2626',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  inputIcon: {
    marginLeft: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3b74f6',
    borderColor: '#3b74f6',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#4b5563',
  },
  signupButton: {
    backgroundColor: '#3b74f6',
    borderRadius: 26,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  signupButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6b7280',
    fontSize: 14,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#6b7280',
    fontSize: 14,
  },
  footerLink: {
    color: '#3b74f6',
    fontSize: 14,
    fontWeight: '600',
  },
  socialContainer: { gap: 10, marginBottom: 24 },
  socialButton: { height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  socialButtonText: { color: '#374151', fontSize: 14, fontWeight: '600' },
  errorText: { color: '#dc2626', fontSize: 13, marginTop: 6 },
  passwordHint: { color: '#6b7280', fontSize: 12, lineHeight: 17, marginTop: -8, marginBottom: 12 },
  socialNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 28, padding: 12, borderRadius: 12, backgroundColor: '#eff6ff' },
  socialNoticeText: { flex: 1, color: '#1d4ed8', fontSize: 12, lineHeight: 17 },
});

export default styles;
