import { Stack } from 'expo-router';
import { DatabaseProvider } from '../database/DatabaseProvider';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <DatabaseProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(services)" />
      </Stack>
    </DatabaseProvider>
  );
}
