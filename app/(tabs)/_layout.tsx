import { Tabs } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { usePreferences } from '@/contexts/preferences-context';
import { useBookmarks } from '@/contexts/bookmarks-context';
import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { preferences } = usePreferences();
  const { bookmarkedCount } = useBookmarks();
  
  const theme = preferences.theme || 'light';
  const appliedTheme = theme === 'auto' ? 'light' : theme;

  if (isLoading) {
    return null; // Or a loading screen
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        headerStyle: {
          backgroundColor: appliedTheme === 'dark' ? '#111827' : '#ffffff',
        },
        headerTintColor: appliedTheme === 'dark' ? '#ffffff' : '#000000',
        contentStyle: {
          backgroundColor: appliedTheme === 'dark' ? '#111827' : '#ffffff',
        },
        tabBarStyle: {
          backgroundColor: appliedTheme === 'dark' ? '#1F2937' : '#ffffff',
          borderTopColor: appliedTheme === 'dark' ? '#374151' : '#E5E7EB',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Courses',
          tabBarLabel: 'Courses',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📖</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          href: null, // Hide from tab bar
          headerStyle: {
            backgroundColor: appliedTheme === 'dark' ? '#111827' : '#ffffff',
          },
          headerTintColor: appliedTheme === 'dark' ? '#ffffff' : '#000000',
          contentStyle: {
            backgroundColor: appliedTheme === 'dark' ? '#111827' : '#ffffff',
          },
        }}
      />
      <Tabs.Screen
        name="bookmarked-courses"
        options={{
          title: 'Bookmarks',
          tabBarLabel: 'Bookmarks',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ position: 'relative' }}>
              <MaterialIcons 
                name="bookmark" 
                size={size} 
                color={focused ? '#3B82F6' : color} 
              />
              {bookmarkedCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -8,
                    backgroundColor: '#EF4444',
                    borderRadius: 10,
                    minWidth: 20,
                    height: 20,
                    paddingHorizontal: 6,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: appliedTheme === 'dark' ? '#1F2937' : '#ffffff',
                  }}
                >
                  <Text
                    style={{
                      color: '#ffffff',
                      fontSize: 11,
                      fontWeight: 'bold',
                    }}
                    numberOfLines={1}
                  >
                    {bookmarkedCount > 99 ? '99+' : bookmarkedCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <View
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: 2,
                borderColor: color,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
              }}
            >
              <View
                style={{
                  width: size * 0.4,
                  height: size * 0.4,
                  borderRadius: size * 0.2,
                  backgroundColor: color,
                  marginBottom: size * 0.05,
                }}
              />
              <View
                style={{
                  width: size * 0.6,
                  height: size * 0.3,
                  borderTopLeftRadius: size * 0.15,
                  borderTopRightRadius: size * 0.15,
                  backgroundColor: color,
                }}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
