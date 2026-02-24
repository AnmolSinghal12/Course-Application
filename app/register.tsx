import { useState, useRef, useEffect } from 'react';
import { View, ScrollView, Alert, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/contexts/auth-context';

const SAVED_CREDENTIALS_KEY = '@saved_credentials';

export default function RegisterScreen() {
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { register, user } = useAuth();

  const handleRegister = async (): Promise<void> => {
    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const trimmedUsername = username.trim();
      const trimmedEmail = email.trim();
      
      try {
        await AsyncStorage.setItem(SAVED_CREDENTIALS_KEY, JSON.stringify({
          username: trimmedUsername,
          password: password,
        }));
      } catch (saveError) {
        console.error('Error saving credentials before registration:', saveError);
      }
      
      const result = await register({
        username: trimmedUsername,
        email: trimmedEmail,
        password,
        role: 'USER',
      });
      
      if (result.success) {
        try {
          await AsyncStorage.setItem(SAVED_CREDENTIALS_KEY, JSON.stringify({
            username: trimmedUsername,
            password: password,
          }));
        } catch (saveError) {
          console.error('Error saving registration credentials:', saveError);
        }
      }
      
      if (result.success && result.requiresEmailVerification && result.user) {
        Alert.alert(
          'Registration Successful!',
          'Your account has been created successfully!!',
          [
            {
              text: 'Go to Login',
              onPress: () => router.replace('/login'),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.message || 'Failed to create account';
      if (errorMessage.includes('API URL not configured')) {
        Alert.alert(
          'Configuration Required',
          'API URL is not configured. Please set EXPO_PUBLIC_API_URL in .env file or contact the developer.',
          [{ text: 'OK' }]
        );
      } else if (errorMessage.includes('Network error')) {
        Alert.alert('Connection Error', errorMessage);
      } else if (errorMessage.includes('HTML') || errorMessage.includes('endpoint not found')) {
        Alert.alert(
          'API Error',
          'The registration endpoint was not found. Please check if the API is available or contact support.',
          [{ text: 'OK' }]
        );
      } else if (errorMessage.includes('Invalid response')) {
        Alert.alert(
          'Server Error',
          'The server returned an unexpected response. Please try again later.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Registration Failed', errorMessage);
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
    // Scroll to show password field when focused
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  const handleConfirmPasswordFocus = () => {
  
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar style="auto" />
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ 
          paddingHorizontal: 24, 
          paddingVertical: 48,
          flexGrow: 1,
          justifyContent: 'center',
          minHeight: '100%',
          paddingBottom: 250
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        bounces={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
      >
        <View className="w-full mt-20">
          <Text variant="heading" size="4xl" className="mb-2 text-center">
            Create Account
          </Text>
          <Text variant="body" color="secondary" className="mb-8 text-center">
            Sign up to get started
          </Text>

          <View className="space-y-4 mb-6">
            <Input
              label="Username"
              placeholder="Enter your username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoComplete="username"
            />

            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
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

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onFocus={handleConfirmPasswordFocus}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <Button
            variant="primary"
            onPress={handleRegister}
            disabled={isLoading}
            className="mb-4"
          >
            {isLoading ? 'Creating Account...' : 'Register'}
          </Button>

          <View className="flex-row justify-center items-center mt-4 mb-12">
            <Text variant="body" color="secondary">
              Already have an account?{' '}
            </Text>
            <Link href="/login" asChild>
              <Text variant="body" color="primary" className="font-semibold">
                Login
              </Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
