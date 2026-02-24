import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { usePreferences } from '@/contexts/preferences-context';

export default function WelcomeScreen() {
  const router = useRouter();
  const { preferences } = usePreferences();
  
  const theme = preferences.theme || 'light';
  const appliedTheme = theme === 'auto' ? 'light' : theme;

  const handleGetStarted = () => {
    router.replace('/(tabs)');
  };

  return (
    <View className={`flex-1 ${appliedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      <StatusBar style={appliedTheme === 'dark' ? 'light' : 'auto'} />
      <View className="flex-1 justify-center items-center px-6">
        {/* Degree Icon */}
        <View className="mb-8">
          <View className={`w-32 h-32 rounded-full items-center justify-center mb-6 ${appliedTheme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'}`}>
            <MaterialIcons name="school" size={80} color="#3B82F6" />
          </View>
        </View>

        {/* Welcome Text */}
        <Text variant="heading" size="4xl" className="mb-4 text-center" style={{ color: appliedTheme === 'dark' ? '#fff' : '#111827' }}>
          Welcome to the
        </Text>
        <Text variant="heading" size="4xl" className="mb-2 text-center" color="primary">
          Mini LMS Mobile App
        </Text>
        <Text variant="body" className="mb-12 text-center px-4" size="lg" style={{ color: appliedTheme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
          Your gateway to learning and knowledge
        </Text>

        {/* Get Started Button */}
        <Button
          variant="primary"
          onPress={handleGetStarted}
          className="w-full max-w-sm"
        >
          <Text className="text-white font-semibold text-lg">Get Started</Text>
        </Button>
      </View>
    </View>
  );
}
