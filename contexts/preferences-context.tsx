import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFERENCES_KEY = '@user_preferences';

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  notificationsEnabled?: boolean;
  searchHistory?: string[];
  lastSearchQuery?: string;
  coursesPerPage?: number;
  sortBy?: 'title' | 'price' | 'rating' | 'date';
  [key: string]: any;
}

interface PreferencesContextType {
  preferences: UserPreferences;
  isLoading: boolean;
  updatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => Promise<void>;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => Promise<void>;
  resetPreferences: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const defaultPreferences: UserPreferences = {
  theme: 'light',
  language: 'en',
  notificationsEnabled: true,
  searchHistory: [],
  lastSearchQuery: '',
  coursesPerPage: 10,
  sortBy: 'title',
};

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
      } else {
        
        await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(defaultPreferences));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      setPreferences(defaultPreferences);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ): Promise<void> => {
    try {
      const updated = { ...preferences, [key]: value };
      setPreferences(updated);
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating preference:', error);
      throw error;
    }
  };

  const updatePreferences = async (newPreferences: Partial<UserPreferences>): Promise<void> => {
    try {
      const updated = { ...preferences, ...newPreferences };
      setPreferences(updated);
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  };

  const resetPreferences = async (): Promise<void> => {
    try {
      setPreferences(defaultPreferences);
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(defaultPreferences));
    } catch (error) {
      console.error('Error resetting preferences:', error);
      throw error;
    }
  };

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        isLoading,
        updatePreference,
        updatePreferences,
        resetPreferences,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextType {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
