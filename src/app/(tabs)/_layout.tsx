import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, useWindowDimensions, View, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../firebase/config';

type FloatingTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
type DisplayRoute = 'index' | 'edit' | 'camera' | 'history' | 'profile';

const TAB_ICONS: Record<DisplayRoute, keyof typeof Ionicons.glyphMap> = {
  index: 'home-outline',
  edit: 'create-outline',
  camera: 'camera-outline',
  history: 'time-outline',
  profile: 'person-outline',
};

const TAB_LABELS: Record<DisplayRoute, string> = {
  index: 'Home',
  edit: 'Editor',
  camera: 'Camera',
  history: 'History',
  profile: 'Profile',
};

const DISPLAY_ROUTES: DisplayRoute[] = ['index', 'edit', 'camera', 'history', 'profile'];

function FloatingTabBar({ state, descriptors, navigation }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const horizontalMargin = width < 360 ? 10 : 16;
  const bottomInset = Math.max(insets.bottom, 8);
  const compact = width < 380;
  const currentRoute = state.routes[state.index]?.name;
  
  const activeIndex = Math.max(0, DISPLAY_ROUTES.findIndex(r => r === currentRoute));
  const translateX = useRef(new Animated.Value(activeIndex)).current;
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: activeIndex,
      useNativeDriver: true,
      bounciness: 4,
      speed: 12,
    }).start();
  }, [activeIndex, translateX]);

  const tabWidth = barWidth / DISPLAY_ROUTES.length;

  return (
    <View style={[styles.tabBarWrapper, { paddingHorizontal: horizontalMargin, paddingBottom: bottomInset }]}>
      <View 
        style={styles.floatingBar}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      >
        {barWidth > 0 && (
          <Animated.View 
            style={[
              styles.slidingIndicator, 
              { 
                width: tabWidth,
                transform: [{
                  translateX: translateX.interpolate({
                    inputRange: [0, 1, 2, 3, 4],
                    outputRange: [0, tabWidth, tabWidth * 2, tabWidth * 3, tabWidth * 4]
                  })
                }]
              }
            ]}
          >
            <View style={styles.activeCircle} />
            {!compact && <Text style={[styles.tabLabel, { color: 'transparent' }]}> </Text>}
          </Animated.View>
        )}

        {DISPLAY_ROUTES.map((routeName, index) => {
          const route = state.routes.find(candidate => candidate.name === routeName);
          const focused = currentRoute === routeName;
          const label = TAB_LABELS[routeName] ?? routeName;

          const onPress = () => {
            if (routeName === 'camera') {
              navigation.emit({ type: 'tabPress', target: route?.key || '', canPreventDefault: true });
              return;
            }
            if (route) {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(routeName);
            }
          };

          return (
            <Pressable
              key={routeName}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={onPress}
              style={styles.tabItem}
              android_ripple={{ color: 'transparent' }}
            >
              <View style={styles.iconSlot}>
                <Ionicons
                  name={TAB_ICONS[routeName]}
                  size={compact ? 20 : 22}
                  color={focused ? '#ffffff' : '#9ca3af'}
                />
              </View>
              {!compact && <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const router = useRouter();

  useEffect(() => {
    return onAuthStateChanged(auth, user => {
      if (!user) router.replace('/(auth)/login');
    });
  }, [router]);

  return (
    <Tabs
      tabBar={props => <FloatingTabBar {...props} />}
      screenOptions={{ 
        headerShown: false, 
        tabBarShowLabel: false,
        tabBarStyle: { position: 'absolute', backgroundColor: 'transparent', elevation: 0, borderTopWidth: 0 }
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="edit" options={{ title: 'Editor' }} />
      <Tabs.Screen
        name="camera"
        options={{ title: 'Camera' }}
        listeners={() => ({
          tabPress: event => {
            event.preventDefault();
            router.push('/(services)/capture');
          },
        })}
      />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  floatingBar: {
    width: '100%',
    maxWidth: 520,
    height: 72,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 36,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 10,
    position: 'relative',
  },
  slidingIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  activeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    zIndex: 1,
  },
  iconSlot: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
    color: '#9ca3af',
  },
  tabLabelActive: {
    color: '#2563eb',
  },
});
