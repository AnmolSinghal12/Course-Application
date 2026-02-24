import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StorageForm } from '@/components/storage/storage-form';
import { useAsyncStorage } from '@/hooks/use-async-storage';

export default function AsyncStorageDemo() {
  const { save, get, remove, clearAll, retrievedValue, allKeys } = useAsyncStorage();

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="auto" />
      <StorageForm
        onSave={save}
        onGet={get}
        onDelete={remove}
        onClearAll={clearAll}
        retrievedValue={retrievedValue}
        allKeys={allKeys}
        title="AsyncStorage Demo"
        description="Store general app data (preferences, cache, etc.)"
        showClearAll={true}
      />
    </View>
  );
}
