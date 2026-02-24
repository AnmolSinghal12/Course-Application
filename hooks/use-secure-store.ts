import { useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

export function useSecureStore() {
  const [retrievedValue, setRetrievedValue] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const save = async (key: string, value: string): Promise<boolean> => {
    if (!key.trim() || !value.trim()) {
      Alert.alert('Error', 'Please enter both key and value');
      return false;
    }

    try {
      setLoading(true);
      await SecureStore.setItemAsync(key, value);
      Alert.alert('Success', 'Data saved securely!');
      return true;
    } catch (error) {
      Alert.alert('Error', `Failed to save: ${error}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const get = async (key: string): Promise<string | null> => {
    if (!key.trim()) {
      Alert.alert('Error', 'Please enter a key');
      return null;
    }

    try {
      setLoading(true);
      const result = await SecureStore.getItemAsync(key);
      if (result) {
        setRetrievedValue(result);
        Alert.alert('Success', 'Data retrieved successfully!');
        return result;
      } else {
        setRetrievedValue('');
        Alert.alert('Not Found', 'No data found for this key');
        return null;
      }
    } catch (error) {
      Alert.alert('Error', `Failed to retrieve: ${error}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (key: string): Promise<boolean> => {
    if (!key.trim()) {
      Alert.alert('Error', 'Please enter a key');
      return false;
    }

    try {
      setLoading(true);
      await SecureStore.deleteItemAsync(key);
      setRetrievedValue('');
      Alert.alert('Success', 'Data deleted successfully!');
      return true;
    } catch (error) {
      Alert.alert('Error', `Failed to delete: ${error}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    save,
    get,
    remove,
    retrievedValue,
    loading,
  };
}
