import { useState, useRef, useEffect, useCallback } from 'react';
import { View, ScrollView, Alert, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Link, router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/contexts/auth-context';
import { usePreferences } from '@/contexts/preferences-context';

const SAVED_CREDENTIALS_KEY = '@saved_credentials';

export default function LoginScreen() {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { login } = useAuth();
  const { preferences } = usePreferences();
  
  const theme = preferences.theme || 'light';
  const appliedTheme = theme === 'auto' ? 'light' : theme;

  const loadSavedCredentials = useCallback(async () => {
    try {
      const savedData = await AsyncStorage.getItem(SAVED_CREDENTIALS_KEY);
      if (savedData) {
        const credentials = JSON.parse(savedData);
        if (credentials.username) {
          setUsername(credentials.username);
        }
        if (credentials.password) {
          setPassword(credentials.password);
        }
      }
    } catch (error) {
      console.error('Error loading saved credentials:', error);
    }
  }, []);

  
  useEffect(() => {
    loadSavedCredentials();
  }, [loadSavedCredentials]);

  useFocusEffect(
    useCallback(() => {
      loadSavedCredentials();
    }, [loadSavedCredentials])
  );

  const handleLogin = async (): Promise<void> => {
    const trimmedUsername = username.trim();
    
    if (!trimmedUsername || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login({ 
        username: trimmedUsername,
        password 
      });
      
      try {
        await AsyncStorage.setItem(SAVED_CREDENTIALS_KEY, JSON.stringify({
          username: trimmedUsername,
          password: password,
        }));
      } catch (saveError) {
        console.error('Error saving credentials:', saveError);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Invalid username or password';
      
      if (errorMessage.includes('API URL not configured')) {
        Alert.alert(
          'Configuration Required',
          'API URL is not configured. Please set EXPO_PUBLIC_API_URL in .env file or contact the developer.',
          [{ text: 'OK' }]
        );
      } else if (errorMessage.includes('Network error')) {
        Alert.alert('Connection Error', errorMessage);
      } else if (errorMessage.includes('User does not exist') || errorMessage.includes('does not exist')) {
        Alert.alert(
          'Login Failed',
          'The username you entered does not exist. Please check your username or register a new account.',
          [{ text: 'OK' }]
        );
      } else if (errorMessage.includes('Invalid') || errorMessage.includes('incorrect') || errorMessage.includes('wrong')) {
        Alert.alert(
          'Login Failed',
          'Invalid username or password. Please check your credentials and try again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Login Failed', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const handlePasswordFocus = () => {
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={`flex-1 ${appliedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar style={appliedTheme === 'dark' ? 'light' : 'auto'} />
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ 
          paddingHorizontal: 24, 
          paddingVertical: 48,
          flexGrow: 1,
          justifyContent: 'center',
          minHeight: '100%',
          paddingBottom: 200
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        bounces={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
      >
        <View className="w-full">
          <Text variant="heading" size="4xl" className="mb-2 text-center">
            Welcome Back
          </Text>
          <Text variant="body" color="secondary" className="mb-8 text-center">
            Sign in to continue
          </Text>

          <View className="space-y-4 mb-6">
            <Input
              label="Username"
              placeholder="Enter your username"
              value={username}
              onChangeText={setUsername}
              keyboardType="default"
              autoCapitalize="none"
              autoComplete="username"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              onFocus={handlePasswordFocus}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
            />
          </View>

          <Button
            variant="primary"
            onPress={handleLogin}
            disabled={isLoading}
            className="mb-4"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>

          <View className="flex-row justify-center items-center mt-4 mb-12">
            <Text variant="body" color="secondary">
              Don't have an account?{' '}
            </Text>
            <Link href="/register" asChild>
              <Text variant="body" color="primary" className="font-semibold">
                Register
              </Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
