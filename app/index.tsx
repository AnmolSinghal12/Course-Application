import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/welcome" />;
  }

  return <Redirect href="/login" />;
}
