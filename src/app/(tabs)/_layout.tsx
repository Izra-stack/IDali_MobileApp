import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Dynamically calculate the tab bar height based on the device's safe area bottom inset
  const bottomPadding = Math.max(insets.bottom, 8);
  const tabHeight = 60 + bottomPadding;

  return (
    <Tabs screenOptions={{ 
      headerShown: false,
      tabBarActiveTintColor: '#3b74f6',
      tabBarInactiveTintColor: '#4b5563',
      tabBarShowLabel: true,
      tabBarStyle: {
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        height: tabHeight,
        paddingBottom: bottomPadding,
        paddingTop: 8,
        backgroundColor: '#ffffff',
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
      }
    }}>
      <Tabs.Screen 
        name="index" 
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="edit" 
        options={{
          title: 'Edit',
          tabBarIcon: ({ color }) => <Ionicons name="create-outline" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="camera" 
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={styles.fabContainer}>
              <View style={styles.fabInner}>
                <Ionicons name="camera-outline" size={28} color="#000000" />
              </View>
            </View>
          ),
        }}
        listeners={() => ({
          tabPress: (e) => {
            e.preventDefault();
            router.push('/(services)/capture');
          },
        })}
      />
      <Tabs.Screen 
        name="history" 
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <Ionicons name="time-outline" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />
        }} 
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  fabInner: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
