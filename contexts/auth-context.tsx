import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, User, LoginRequest, RegisterRequest } from '@/lib/api';
import { router } from 'expo-router';

interface RegisterResult {
  success: boolean;
  requiresEmailVerification?: boolean;
  user?: User;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  refreshAuthToken: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';
const PROFILE_DATA_KEY = '@user_profile_data';
const PROFILE_PICTURE_KEY = '@user_profile_picture';
const ENROLLED_COURSES_KEY = '@enrolled_courses';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const normalizeUser = (user: User): User => {
    if (user._id && !user.id) {
      return { ...user, id: user._id };
    }
    if (user.id && !user._id) {
      return { ...user, _id: user.id };
    }
    return user;
  };


  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async (): Promise<void> => {
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const storedUser = await SecureStore.getItemAsync(USER_KEY);

      if (storedToken && storedUser) {
      
        const parsedUser = JSON.parse(storedUser);
        const normalizedUser = normalizeUser(parsedUser);
        setToken(storedToken);
        setUser(normalizedUser);
        
        try {
          const currentUser = await apiService.getCurrentUser(storedToken);
          const updatedNormalizedUser = normalizeUser(currentUser);
          setUser(updatedNormalizedUser);
          await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedNormalizedUser));
        } catch (error: any) {
          const isInvalidToken = error?.message?.includes('Invalid access token') || 
                                 error?.message?.includes('Invalid token') ||
                                 error?.message?.includes('401');
          
          if (isInvalidToken) {
            const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
            if (refreshToken) {
              try {
                const refreshResponse = await apiService.refreshToken(refreshToken);
                await setAuthData(refreshResponse.token, refreshResponse.refreshToken, normalizedUser);
              } catch (refreshError: any) {
                if (refreshError?.message?.includes('Invalid refresh token') || 
                    refreshError?.message?.includes('401')) {
                  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    
    } finally {
      setIsLoading(false);
    }
  };

  const setAuthData = async (
    authToken: string | null,
    refreshToken?: string,
    userData?: User | null
  ): Promise<void> => {
    if (authToken) {
      await SecureStore.setItemAsync(TOKEN_KEY, authToken);
    }
    if (refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    }
    if (userData) {
      const normalizedUser = normalizeUser(userData);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(normalizedUser));
      setUser(normalizedUser);
    }
    if (authToken) {
      setToken(authToken);
    }
  };

  const clearAuthData = async (): Promise<void> => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    try {
      await AsyncStorage.removeItem(PROFILE_DATA_KEY);
      await AsyncStorage.removeItem(PROFILE_PICTURE_KEY);
      await AsyncStorage.removeItem(ENROLLED_COURSES_KEY);
    } catch (error) {
      console.error('Error clearing profile data:', error);
    }
    setToken(null);
    setUser(null);
  };

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      const response = await apiService.login(credentials);
      
      const user = response.data?.user || response.user || (response as any).data?.user || (response as any).data;
      const token = response.data?.accessToken || response.token || (response as any).accessToken || (response as any).data?.accessToken || '';
      const refreshToken = response.data?.refreshToken || response.refreshToken || (response as any).data?.refreshToken;
      
      if (!user) {
        throw new Error('User data not found in server response');
      }
      
      if (!token) {
        throw new Error('Authentication token not found in server response');
      }
      
      const normalizedUser = normalizeUser(user);
      
      try {
        await AsyncStorage.removeItem(PROFILE_DATA_KEY);
        await AsyncStorage.removeItem(PROFILE_PICTURE_KEY);
        await AsyncStorage.removeItem(ENROLLED_COURSES_KEY);
      } catch (error) {
        console.error('Error clearing old profile data on login:', error);
      }
      
      await setAuthData(token, refreshToken, normalizedUser);
      router.replace('/welcome');
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterRequest): Promise<RegisterResult> => {
    try {
      const response = await apiService.register(data);
      
      const user = response.data?.user || response.user || (response as any).data;
      const token = response.data?.accessToken || (response as any).token || (response as any).accessToken || '';
      const refreshToken = response.data?.refreshToken || (response as any).refreshToken;
      
      if (!user) {
        console.error('No user in response:', response);
        throw new Error('Invalid response: User data not found in server response');
      }
      
      const normalizedUser = normalizeUser(user);
      
      try {
        await AsyncStorage.removeItem(PROFILE_DATA_KEY);
        await AsyncStorage.removeItem(PROFILE_PICTURE_KEY);
        await AsyncStorage.removeItem(ENROLLED_COURSES_KEY);
      } catch (error) {
        console.error('Error clearing old profile data on register:', error);
      }
      
      if (token) {
        await setAuthData(token, refreshToken, normalizedUser);
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 200);
        return {
          success: true,
          requiresEmailVerification: false,
          user: normalizedUser,
        };
      } else {
        
        await setAuthData(null, undefined, normalizedUser);
        
        console.log('Registration successful. User ID:', normalizedUser._id || normalizedUser.id);
        console.log('Email verification required. Please check your email.');
        return {
          success: true,
          requiresEmailVerification: true,
          user: normalizedUser,
        };
      }
    } catch (error) {
      console.error('Registration error in context:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (token) {
        try {
          await apiService.logout(token);
        } catch (error: any) {
        }
      }
    } catch (error) {
    } finally {
      await clearAuthData();
      router.replace('/login');
    }
  };

  const refreshAuthToken = async (): Promise<void> => {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiService.refreshToken(refreshToken);
      const newToken = response.token;
      const newRefreshToken = response.refreshToken;
      await setAuthData(newToken, newRefreshToken, user);
    } catch (error: any) {

      if (error?.message?.includes('Invalid refresh token') || 
          error?.message?.includes('401')) {
        console.log('Refresh token is invalid, logging out');
        await clearAuthData();
        router.replace('/login');
      } else {
        
        console.log('Token refresh failed:', error?.message);
        throw error;
      }
    }
  };

  const updateUser = (userData: User): void => {
    const normalizedUser = normalizeUser(userData);
    setUser(normalizedUser);
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(normalizedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        refreshAuthToken,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
