import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { PreferencesProvider, usePreferences } from '@/contexts/preferences-context';
import { BookmarksProvider } from '@/contexts/bookmarks-context';
import { OfflineBanner } from '@/components/error/offline-banner';
import { useNotifications } from '@/hooks/use-notifications';
import '../global.css';

function RootLayoutNav() {
  const { isLoading, isAuthenticated } = useAuth();
  const { preferences } = usePreferences();
  
  useNotifications();

 
  const theme = preferences.theme || 'light';
  const appliedTheme = theme === 'auto' ? 'light' : theme;

  
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: appliedTheme === 'dark' ? '#111827' : '#ffffff' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={appliedTheme === 'dark' ? 'light' : 'auto'} />
      <View style={{ flex: 1, backgroundColor: appliedTheme === 'dark' ? '#111827' : '#ffffff' }}>
        <Stack 
          screenOptions={{ 
            headerShown: false,
            contentStyle: {
              backgroundColor: appliedTheme === 'dark' ? '#111827' : '#ffffff',
            },
          }}
        >
          {isAuthenticated ? (
            <>
              <Stack.Screen name="welcome" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen 
                name="course-details" 
                options={{ 
                  headerShown: true, 
                  title: 'Course Details',
                  headerStyle: {
                    backgroundColor: appliedTheme === 'dark' ? '#1F2937' : '#ffffff',
                  },
                  headerTintColor: appliedTheme === 'dark' ? '#ffffff' : '#000000',
                }} 
              />
              <Stack.Screen 
                name="course-webview" 
                options={{ 
                  headerShown: true, 
                  title: 'Course Content',
                  headerStyle: {
                    backgroundColor: appliedTheme === 'dark' ? '#1F2937' : '#ffffff',
                  },
                  headerTintColor: appliedTheme === 'dark' ? '#ffffff' : '#000000',
                }} 
              />
              <Stack.Screen 
                name="secure-store" 
                options={{ 
                  title: 'Secure Store Demo', 
                  headerShown: true,
                  headerStyle: {
                    backgroundColor: appliedTheme === 'dark' ? '#1F2937' : '#ffffff',
                  },
                  headerTintColor: appliedTheme === 'dark' ? '#ffffff' : '#000000',
                }} 
              />
              <Stack.Screen 
                name="async-storage" 
                options={{ 
                  title: 'AsyncStorage Demo', 
                  headerShown: true,
                  headerStyle: {
                    backgroundColor: appliedTheme === 'dark' ? '#1F2937' : '#ffffff',
                  },
                  headerTintColor: appliedTheme === 'dark' ? '#ffffff' : '#000000',
                }} 
              />
            </>
          ) : (
            <>
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="register" options={{ headerShown: false }} />
              <Stack.Screen name="index" options={{ headerShown: false }} />
            </>
          )}
        </Stack>
      </View>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <BookmarksProvider>
          <View style={{ flex: 1 }}>
            <OfflineBanner />
            <RootLayoutNav />
          </View>
        </BookmarksProvider>
      </PreferencesProvider>
    </AuthProvider>
  );
}
