import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StorageForm } from '@/components/storage/storage-form';
import { useSecureStore } from '@/hooks/use-secure-store';

export default function SecureStoreDemo() {
  const { save, get, remove, retrievedValue } = useSecureStore();

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="auto" />
      <StorageForm
        onSave={save}
        onGet={get}
        onDelete={remove}
        retrievedValue={retrievedValue}
        title="Expo SecureStore Demo"
        description="Store sensitive data securely (tokens, passwords, etc.)"
      />
    </View>
  );
}
