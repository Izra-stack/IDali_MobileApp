import { Stack } from 'expo-router';

export default function AuthLayout() {
  // Structure: group login and signup routes without visible headers.
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
