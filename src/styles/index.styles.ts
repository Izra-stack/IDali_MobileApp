import { StyleSheet } from 'react-native';

// Styles: welcome screen layout and Continue action.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3b74f6', // Close to the blue in the image
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 40,
  },
  welcomeText: {
    color: '#eaf1ff',
    fontSize: 15,
    marginBottom: 24,
  },
  continueButton: {
    backgroundColor: '#ffffff',
    minWidth: 180,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.65,
  },
  continueButtonText: {
    color: '#3b74f6',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default styles;
