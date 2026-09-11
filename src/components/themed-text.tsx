import { Text, type TextProps } from "react-native";

// Component: reusable themed text wrapper.
export function ThemedText({
  style,
  type: _type,
  ...props
}: TextProps & { type?: string }) {
  return <Text {...props} style={[{ color: "#111827" }, style]} />;
}
