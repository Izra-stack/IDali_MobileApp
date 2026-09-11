import { Stack } from 'expo-router';

export default function ServicesLayout() {
  // Structure: group capture, editing, settings, and preview routes.
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
