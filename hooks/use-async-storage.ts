import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export function useAsyncStorage() {
  const [retrievedValue, setRetrievedValue] = useState<string>('');
  const [allKeys, setAllKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadAllKeys();
  }, []);

  const loadAllKeys = async (): Promise<void> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      setAllKeys(keys);
    } catch (error) {
      console.error('Error loading keys:', error);
    }
  };

  const save = async (key: string, value: string): Promise<boolean> => {
    if (!key.trim() || !value.trim()) {
      Alert.alert('Error', 'Please enter both key and value');
      return false;
    }

    try {
      setLoading(true);
      await AsyncStorage.setItem(key, value);
      Alert.alert('Success', 'Data saved!');
      await loadAllKeys();
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
      const result = await AsyncStorage.getItem(key);
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
      await AsyncStorage.removeItem(key);
      setRetrievedValue('');
      Alert.alert('Success', 'Data deleted successfully!');
      await loadAllKeys();
      return true;
    } catch (error) {
      Alert.alert('Error', `Failed to delete: ${error}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearAll = async (): Promise<boolean> => {
    try {
      setLoading(true);
      await AsyncStorage.clear();
      setRetrievedValue('');
      setAllKeys([]);
      Alert.alert('Success', 'All data cleared!');
      return true;
    } catch (error) {
      Alert.alert('Error', `Failed to clear: ${error}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    save,
    get,
    remove,
    clearAll,
    retrievedValue,
    allKeys,
    loading,
  };
}
