import { View, type ViewProps } from 'react-native';

// Component: reusable themed view wrapper.
export function ThemedView({ style, ...props }: ViewProps & { type?: string }) {
  return <View {...props} style={[{ backgroundColor: '#ffffff' }, style]} />;
}
