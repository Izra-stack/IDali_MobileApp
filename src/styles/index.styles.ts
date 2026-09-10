import { StyleSheet } from 'react-native';

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
  loadingContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  loadingText: {
    color: '#3b74f6',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default styles;
