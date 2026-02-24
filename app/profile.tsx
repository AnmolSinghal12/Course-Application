import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, ScrollView, Alert, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { usePreferences } from '@/contexts/preferences-context';
import { useTranslation } from '@/hooks/use-translation';
import { apiService } from '@/lib/api';
import { useEnrolledCourses } from '@/hooks/use-enrolled-courses';
import { useCourses } from '@/hooks/use-courses';
import { Image as ExpoImage } from 'expo-image';
import { Course } from '@/lib/api';

const PROFILE_PICTURE_KEY = '@user_profile_picture';
const PROFILE_DATA_KEY = '@user_profile_data';

export default function ProfileScreen() {
  const { user, token, logout, updateUser } = useAuth();
  const { preferences, updatePreference } = usePreferences();
  const { t } = useTranslation();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUpdatingPicture, setIsUpdatingPicture] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [localProfilePicture, setLocalProfilePicture] = useState<string | null>(null);
  const { enrolledCourses, getEnrolledCount, getAverageProgress, loadEnrolledCourses } = useEnrolledCourses();
  const { courses, instructors, refresh: refreshCourses } = useCourses();

  useEffect(() => {
    const loadLocalData = async () => {
      try {
        if (!user) return;
        
        const savedPicture = await AsyncStorage.getItem(PROFILE_PICTURE_KEY);
        if (savedPicture) {
          setLocalProfilePicture(savedPicture);
        }
        
        const savedProfileData = await AsyncStorage.getItem(PROFILE_DATA_KEY);
        if (savedProfileData) {
          const profileData = JSON.parse(savedProfileData);
          const savedEmail = profileData.email?.toLowerCase().trim();
          const currentEmail = user.email?.toLowerCase().trim();
          const savedUsername = profileData.username?.toLowerCase().trim();
          const currentUsername = (user.username || user.name)?.toLowerCase().trim();
          
          const isSameUser = (savedEmail && currentEmail && savedEmail === currentEmail) ||
                           (savedUsername && currentUsername && savedUsername === currentUsername);
          
          if (isSameUser && (profileData.username || profileData.email)) {
            updateUser({
              ...user,
              username: profileData.username || user.username,
              email: profileData.email || user.email,
            });
          } else if (!isSameUser) {
           
            await AsyncStorage.removeItem(PROFILE_DATA_KEY);
            await AsyncStorage.removeItem(PROFILE_PICTURE_KEY);
            setLocalProfilePicture(null);
          }
        }
      } catch (error) {
        console.error('Error loading local profile data:', error);
      }
    };
    loadLocalData();
  }, [user]);

  const getInstructorName = useCallback((index: number): string => {
    if (instructors[index]) {
      const instructor = instructors[index];
      if (typeof instructor.name === 'object' && instructor.name.first && instructor.name.last) {
        return `${instructor.name.first} ${instructor.name.last}`;
      }
      if (typeof instructor.name === 'string') {
        return instructor.name;
      }
      return instructor.login?.username || 'Instructor';
    }
    return 'Instructor';
  }, [instructors]);

  const getInstructorImage = useCallback((index: number): string | undefined => {
    return instructors[index]?.picture?.large || 
           instructors[index]?.picture?.medium || 
           instructors[index]?.picture?.thumbnail;
  }, [instructors]);

  const calculateOverallProgress = useCallback((): number => {
    if (courses.length === 0) return 0;
    
    const completedCourses = enrolledCourses.filter(course => course.progress >= 100).length;
    
    const progress = (completedCourses / courses.length) * 100;
    
    return Math.round(progress);
  }, [enrolledCourses, courses.length]);
  
  const statistics = useMemo(() => {
    const enrolledCount = getEnrolledCount();
    const overallProgress = calculateOverallProgress();
    
    return {
      coursesEnrolled: enrolledCount,
      progress: overallProgress,
    };
  }, [enrolledCourses, courses.length, getEnrolledCount, calculateOverallProgress]);

  const loadStatistics = async (): Promise<void> => {
    if (!token) return;

    try {
      setIsLoading(true);
      await apiService.getUserStatistics(token);
    } catch (error: any) {
      if (!error.message?.includes('endpoint not found') && !error.message?.includes('HTML')) {
        console.warn('Error loading statistics from API:', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadEnrolledCourses();
    }
  }, [user]);

  useEffect(() => {
    loadStatistics();
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadEnrolledCourses();
        loadStatistics();
      }
    }, [user])
  );

  useFocusEffect(
    useCallback(() => {
      if (!isLoading && courses.length === 0) {
        refreshCourses();
      }
      return () => {
      };
    }, [isLoading, courses.length, refreshCourses])
  );

  const pickImage = async (): Promise<void> => {
    try {
      Alert.alert(
        'Update Profile Picture',
        'Choose an option',
        [
          {
            text: 'Camera',
            onPress: async () => {
              await takePhotoFromCamera();
            },
          },
          {
            text: 'Gallery',
            onPress: async () => {
              await pickImageFromGallery();
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to open image picker');
    }
  };

  const takePhotoFromCamera = async (): Promise<void> => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera permissions to take a photo');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images || 'images',
        allowsEditing: false, 
        quality: 0.3,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', error.message || 'Failed to take photo');
    }
  };

  const pickImageFromGallery = async (): Promise<void> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to select a photo');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images || 'images',
        allowsEditing: false,
        quality: 0.3,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      Alert.alert('Error', error.message || 'Failed to pick image');
    }
  };

  const handleConfirmImage = async (): Promise<void> => {
    if (!selectedImage) {
      Alert.alert('Error', 'No image selected');
      return;
    }

    setIsUpdatingPicture(true);
    try {
      await AsyncStorage.setItem(PROFILE_PICTURE_KEY, selectedImage);
      setLocalProfilePicture(selectedImage);
      setSelectedImage(null);
      
      if (token) {
        try {
          const updatedUser = await apiService.updateProfilePicture(
            token,
            selectedImage
          );
          if (updatedUser?.profilePicture) {
            updateUser(updatedUser);
          }
        } catch (apiError) {
        }
      }
      
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error: any) {
      console.error('Error saving profile picture:', error);
      Alert.alert('Error', 'Failed to save profile picture. Please try again.');
    } finally {
      setIsUpdatingPicture(false);
    }
  };

  const handleCancelImage = (): void => {
    setSelectedImage(null);
  };

  const handleRemoveImage = async (): Promise<void> => {
    Alert.alert(
      'Remove Profile Picture',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(PROFILE_PICTURE_KEY);
              setLocalProfilePicture(null);
              
              if (token) {
                try {
                  await apiService.updateProfilePicture(token, '');
                } catch (apiError) {
                }
              }
              
              Alert.alert('Success', 'Profile picture removed successfully!');
            } catch (error: any) {
              console.error('Error removing profile picture:', error);
              Alert.alert('Error', 'Failed to remove profile picture. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = async (): Promise<void> => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(preferences.notificationsEnabled ?? true);
  const [isEditProfileVisible, setIsEditProfileVisible] = useState<boolean>(false);
  const [editUsername, setEditUsername] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState<boolean>(false);
  const [isThemeModalVisible, setIsThemeModalVisible] = useState<boolean>(false);
  const [isEnrolledCoursesModalVisible, setIsEnrolledCoursesModalVisible] = useState<boolean>(false);

  const currentTheme = preferences.theme || 'light';
  
  const getThemeDisplayName = (theme: string): string => {
    switch (theme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'auto': return 'Auto';
      default: return 'Light';
    }
  };

  const appliedTheme = currentTheme === 'auto' ? 'light' : currentTheme;

  return (
    <View className={`flex-1 ${appliedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      <StatusBar style={appliedTheme === 'dark' ? 'light' : 'auto'} />
      
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View className="items-center mb-8 px-6 pt-6">
          <View className="relative mb-4">
            <TouchableOpacity
              onPress={pickImage}
              disabled={isUpdatingPicture}
              className="relative"
              activeOpacity={0.7}
            >
              <View className={`w-32 h-32 rounded-full ${appliedTheme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'} items-center justify-center overflow-hidden`}>
                {(() => {
                  const imageUrl = localProfilePicture || user.profilePicture || user.avatar?.url;
                  const isValidImageUrl = imageUrl && 
                    !imageUrl.includes('via.placeholder.com') && 
                    !imageUrl.includes('placeholder') &&
                    (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('file://') || imageUrl.startsWith('content://'));
                  
                  return isValidImageUrl ? (
                    <ExpoImage
                      source={{ uri: imageUrl }}
                      style={{ width: 128, height: 128 }}
                      contentFit="cover"
                      transition={200}
                      cachePolicy="memory-disk"
                      onError={(error) => {
                      }}
                      onLoad={() => {
                      }}
                    />
                  ) : (
                    <Text variant="heading" size="4xl" color="muted">
                      {(user.username || user.name || 'U').charAt(0).toUpperCase()}
                    </Text>
                  );
                })()}
              </View>
              {isUpdatingPicture && (
                <View className="absolute inset-0 bg-black/50 rounded-full items-center justify-center">
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}
              <View className="absolute bottom-0 right-0 bg-gray-700 rounded-full p-2 border-2 border-white">
                <MaterialIcons name="edit" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            
            {(() => {
              const imageUrl = localProfilePicture || user.profilePicture || user.avatar?.url;
              const isValidImageUrl = imageUrl && 
                !imageUrl.includes('via.placeholder.com') && 
                !imageUrl.includes('placeholder') &&
                (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('file://') || imageUrl.startsWith('content://'));
              
              return isValidImageUrl ? (
                <TouchableOpacity
                  onPress={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-2 border-2 border-white"
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="delete" size={16} color="#fff" />
                </TouchableOpacity>
              ) : null;
            })()}
          </View>
          
          {/* Name */}
          <Text variant="heading" size="2xl" className="mb-2" style={{ fontWeight: '700' }}>
            {user.username || user.name || 'User'}
          </Text>
          
          {/* Email */}
          <Text variant="body" className="text-center text-sm" style={{ color: appliedTheme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
            {user.email || 'youremail@domain.com'}
          </Text>
        </View>

        <View className="px-6 mb-4">
          <Card className="p-0 overflow-hidden">
            <TouchableOpacity 
              className={`flex-row items-center justify-between p-4 border-b ${appliedTheme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}
              activeOpacity={0.7}
              onPress={() => {
                setEditUsername(user.username || user.name || '');
                setEditEmail(user.email || '');
                setIsEditProfileVisible(true);
              }}
            >
              <View className="flex-row items-center flex-1">
                <MaterialIcons name="description" size={24} color={appliedTheme === 'dark' ? '#fff' : '#374151'} style={{ marginRight: 12 }} />
                <Text variant="body" size="md" style={{ fontWeight: '500' }}>
                  Edit profile information
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={appliedTheme === 'dark' ? '#9CA3AF' : '#9CA3AF'} />
            </TouchableOpacity>

            <TouchableOpacity 
              className={`flex-row items-center justify-between p-4 border-b ${appliedTheme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}
              activeOpacity={0.7}
              onPress={() => setNotificationsEnabled(!notificationsEnabled)}
            >
              <View className="flex-row items-center flex-1">
                <MaterialIcons name="notifications" size={24} color={appliedTheme === 'dark' ? '#fff' : '#374151'} style={{ marginRight: 12 }} />
                <Text variant="body" size="md" style={{ fontWeight: '500', color: appliedTheme === 'dark' ? '#fff' : '#374151' }}>
                  {t('profile.notifications')}
                </Text>
              </View>
              <Text style={{ color: '#F97316', fontWeight: '600' }}>
                {notificationsEnabled ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>

          </Card>
        </View>

        <View className="px-6 mb-4">
          <Card className="p-0 overflow-hidden">
            <TouchableOpacity 
              className="flex-row items-center justify-between p-4"
              activeOpacity={0.7}
              onPress={() => setIsThemeModalVisible(true)}
            >
              <View className="flex-row items-center flex-1">
                <MaterialIcons name="lightbulb" size={24} color={appliedTheme === 'dark' ? '#fff' : '#374151'} style={{ marginRight: 12 }} />
                <Text variant="body" size="md" style={{ fontWeight: '500', color: appliedTheme === 'dark' ? '#fff' : '#374151' }}>
                  {t('profile.theme')}
                </Text>
              </View>
              <Text style={{ color: '#F97316', fontWeight: '600' }}>
                {getThemeDisplayName(currentTheme)}
              </Text>
            </TouchableOpacity>
          </Card>
        </View>

        <View className="px-6 mb-4">
          <Card className="p-0 overflow-hidden">
            <View className="p-4">
              <Text variant="heading" size="xl" className="mb-4" style={{ color: appliedTheme === 'dark' ? '#fff' : '#111827' }}>
                {t('profile.userStatistics')}
              </Text>
              {isLoading && courses.length === 0 ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : statistics ? (
                <View className="space-y-4">
                  <TouchableOpacity
                    onPress={() => setIsEnrolledCoursesModalVisible(true)}
                    activeOpacity={0.7}
                    className={`flex-row justify-between items-center p-4 rounded-lg ${appliedTheme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-50'}`}
                  >
                    <View>
                      <Text variant="body" color="secondary">
                        {t('profile.coursesEnrolled')}
                      </Text>
                      <Text variant="heading" size="2xl" color="primary">
                        {statistics.coursesEnrolled}
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color={appliedTheme === 'dark' ? '#9CA3AF' : '#9CA3AF'} />
                  </TouchableOpacity>
                  <View className={`flex-row justify-between items-center p-4 rounded-lg ${appliedTheme === 'dark' ? 'bg-green-900/30' : 'bg-green-50'}`}>
                    <View className="flex-1">
                      <Text variant="body" color="secondary" className="mb-2">
                        {t('profile.progress')}
                      </Text>
                      <View className="flex-row items-center space-x-2">
                        <View className={`flex-1 h-2 rounded-full overflow-hidden ${appliedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <View
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${statistics.progress}%` }}
                          />
                        </View>
                        <Text variant="body" weight="semibold" color="success">
                          {statistics.progress}%
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <Text variant="body" color="secondary">
                  No statistics available
                </Text>
              )}
            </View>
          </Card>
        </View>

        <View className="px-6">
          <Button variant="danger" onPress={handleLogout} className="mt-2">
            {t('auth.logout')}
          </Button>
        </View>
      </ScrollView>

      <Modal
        visible={isEditProfileVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsEditProfileVisible(false)}
      >
        <View className="flex-1 bg-black/80 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <Text variant="heading" size="xl" className="mb-4 text-center" style={{ color: appliedTheme === 'dark' ? '#fff' : '#111827' }}>
              {t('profile.editProfile')}
            </Text>
            
            <Input
              label={t('auth.username')}
              placeholder={t('auth.enterUsername')}
              value={editUsername}
              onChangeText={setEditUsername}
              autoCapitalize="none"
              autoComplete="username"
            />

            <Input
              label={t('auth.email')}
              placeholder={t('auth.enterEmail')}
              value={editEmail}
              onChangeText={setEditEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <View className="flex-row space-x-3 mt-4">
              <TouchableOpacity
                onPress={() => setIsEditProfileVisible(false)}
                disabled={isUpdatingProfile}
                className="flex-1 bg-gray-200 rounded-lg py-3 items-center"
                activeOpacity={0.7}
              >
                <Text variant="body" weight="semibold" color="secondary">
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={async () => {
                  if (!editUsername.trim() || !editEmail.trim()) {
                    Alert.alert(t('common.error'), t('auth.fillAllFields'));
                    return;
                  }

                  if (!editEmail.includes('@')) {
                    Alert.alert(t('common.error'), t('auth.enterEmail'));
                    return;
                  }

                  setIsUpdatingProfile(true);
                  try {
                  
                    const profileData = {
                      username: editUsername.trim(),
                      email: editEmail.trim(),
                    };
                    await AsyncStorage.setItem(PROFILE_DATA_KEY, JSON.stringify(profileData));
                    
                    const updatedUserData = {
                      ...user,
                      username: editUsername.trim(),
                      email: editEmail.trim(),
                    };
                    updateUser(updatedUserData);
                    
                    setIsEditProfileVisible(false);
                    
                    if (token) {
                        try {
                          const apiUpdatedUser = await apiService.updateProfile(token, profileData);
                          if (apiUpdatedUser?.username || apiUpdatedUser?.email) {
                            updateUser(apiUpdatedUser);
                          }
                        } catch (apiError) {
                        }
                      }
                    
                    Alert.alert(t('common.success'), t('profile.profileUpdated'));
                  } catch (error: any) {
                    console.error('Error saving profile:', error);
                    Alert.alert(t('common.error'), t('profile.profileUpdated'));
                  } finally {
                    setIsUpdatingProfile(false);
                  }
                }}
                disabled={isUpdatingProfile}
                className="flex-1 bg-blue-500 rounded-lg py-3 items-center flex-row justify-center"
                activeOpacity={0.7}
              >
                {isUpdatingProfile ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="check" size={20} color="#fff" style={{ marginRight: 6 }} />
                    <Text variant="body" weight="semibold" className="text-white">
                      Save
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isThemeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsThemeModalVisible(false)}
      >
        <View className="flex-1 bg-black/80 justify-center items-center px-6">
          <View className={`rounded-2xl p-6 w-full max-w-sm ${appliedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <Text variant="heading" size="xl" className="mb-6 text-center" style={{ color: appliedTheme === 'dark' ? '#fff' : '#111827' }}>
              Select Theme
            </Text>
            
            <TouchableOpacity
              onPress={async () => {
                await updatePreference('theme', 'light');
                setIsThemeModalVisible(false);
              }}
              className={`flex-row items-center justify-between p-4 mb-3 rounded-lg ${appliedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center flex-1">
                <MaterialIcons name="light-mode" size={24} color={appliedTheme === 'dark' ? '#fff' : '#374151'} style={{ marginRight: 12 }} />
                <Text variant="body" size="md" style={{ fontWeight: '500', color: appliedTheme === 'dark' ? '#fff' : '#374151' }}>
                  Light
                </Text>
              </View>
              {currentTheme === 'light' && (
                <MaterialIcons name="check-circle" size={24} color="#3B82F6" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                await updatePreference('theme', 'auto');
                setIsThemeModalVisible(false);
              }}
              className={`flex-row items-center justify-between p-4 mb-3 rounded-lg ${appliedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center flex-1">
                <MaterialIcons name="brightness-auto" size={24} color={appliedTheme === 'dark' ? '#fff' : '#374151'} style={{ marginRight: 12 }} />
                <Text variant="body" size="md" style={{ fontWeight: '500', color: appliedTheme === 'dark' ? '#fff' : '#374151' }}>
                  {t('profile.autoMode')}
                </Text>
              </View>
              {currentTheme === 'auto' && (
                <MaterialIcons name="check-circle" size={24} color="#3B82F6" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                await updatePreference('theme', 'dark');
                setIsThemeModalVisible(false);
              }}
              className={`flex-row items-center justify-between p-4 mb-4 rounded-lg ${appliedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center flex-1">
                <MaterialIcons name="dark-mode" size={24} color={appliedTheme === 'dark' ? '#fff' : '#374151'} style={{ marginRight: 12 }} />
                <Text variant="body" size="md" style={{ fontWeight: '500', color: appliedTheme === 'dark' ? '#fff' : '#374151' }}>
                  {t('profile.darkMode')}
                </Text>
              </View>
              {currentTheme === 'dark' && (
                <MaterialIcons name="check-circle" size={24} color="#3B82F6" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsThemeModalVisible(false)}
              className={`rounded-lg py-3 items-center ${appliedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}
              activeOpacity={0.7}
            >
              <Text variant="body" weight="semibold" style={{ color: appliedTheme === 'dark' ? '#fff' : '#374151' }}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isEnrolledCoursesModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsEnrolledCoursesModalVisible(false)}
      >
        <View className="flex-1 bg-black/80 justify-center items-center px-6">
          <View className={`rounded-2xl p-6 w-full max-w-md max-h-[80%] ${appliedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <View className="flex-row items-center justify-between mb-4">
              <Text variant="heading" size="xl" style={{ color: appliedTheme === 'dark' ? '#fff' : '#111827' }}>
                Enrolled Courses
              </Text>
              <TouchableOpacity
                onPress={() => setIsEnrolledCoursesModalVisible(false)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="close" size={24} color={appliedTheme === 'dark' ? '#fff' : '#374151'} />
              </TouchableOpacity>
            </View>

            <View className="mb-4 pb-3" style={{ borderBottomWidth: 1, borderBottomColor: appliedTheme === 'dark' ? '#374151' : '#E5E7EB' }}>
              <Text variant="body" color="secondary">
                Total Enrolled: <Text variant="body" weight="bold" style={{ color: appliedTheme === 'dark' ? '#fff' : '#111827' }}>{enrolledCourses.length}</Text> course{enrolledCourses.length !== 1 ? 's' : ''}
              </Text>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={true}
              style={{ maxHeight: 500 }}
              contentContainerStyle={{ paddingBottom: 10 }}
            >
              {enrolledCourses.length === 0 ? (
                <View className="items-center py-8">
                  <MaterialIcons name="school" size={48} color={appliedTheme === 'dark' ? '#6B7280' : '#9CA3AF'} />
                  <Text variant="body" color="secondary" className="mt-4 text-center">
                    No courses enrolled yet
                  </Text>
                  <Text variant="caption" color="muted" className="mt-2 text-center">
                    Enroll in courses to see them here
                  </Text>
                </View>
              ) : (
                enrolledCourses.map((course, index) => {
                  return (
                  <TouchableOpacity
                    key={course.id || index}
                    activeOpacity={0.7}
                    className={`mb-3 p-4 rounded-lg border ${appliedTheme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                    onPress={() => {
                      setIsEnrolledCoursesModalVisible(false);
                      router.push({
                        pathname: '/course-details',
                        params: {
                          courseId: String(course.id || index),
                          courseIndex: index.toString(),
                        },
                      });
                    }}
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 mr-2">
                        <View className="flex-row items-center mb-2">
                          <View className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${appliedTheme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'}`}>
                            <Text variant="body" weight="bold" style={{ color: appliedTheme === 'dark' ? '#93C5FD' : '#3B82F6' }}>
                              {index + 1}
                            </Text>
                          </View>
                          <Text variant="heading" size="lg" style={{ color: appliedTheme === 'dark' ? '#fff' : '#111827' }} numberOfLines={2}>
                            {course.title || course.name || `Course ${index + 1}`}
                          </Text>
                        </View>
                        {course.description && (
                          <Text variant="body" color="secondary" size="sm" className="ml-10 mb-2" numberOfLines={2}>
                            {course.description}
                          </Text>
                        )}
                        <View className="flex-row items-center ml-10 mt-2">
                          <View className={`flex-1 h-2 rounded-full overflow-hidden mr-2 ${appliedTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`}>
                            <View
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${course.progress || 0}%` }}
                            />
                          </View>
                          <Text variant="caption" color="success" style={{ minWidth: 40 }}>
                            {course.progress || 0}%
                          </Text>
                        </View>
                      </View>
                      <MaterialIcons name="chevron-right" size={20} color={appliedTheme === 'dark' ? '#9CA3AF' : '#9CA3AF'} />
                    </View>
                  </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelImage}
      >
        <View className={`flex-1 ${appliedTheme === 'dark' ? 'bg-black/90' : 'bg-black/80'} justify-center items-center px-6`}>
          <View className={`rounded-2xl p-6 w-full max-w-sm ${appliedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <Text variant="heading" size="xl" className="mb-4 text-center" style={{ color: appliedTheme === 'dark' ? '#fff' : '#111827' }}>
              Preview Profile Picture
            </Text>
            
            {selectedImage && (
              <View className="items-center mb-6">
                <View className={`w-48 h-48 rounded-full overflow-hidden border-4 ${appliedTheme === 'dark' ? 'border-blue-600' : 'border-blue-200'}`}>
                  <ExpoImage
                    source={{ uri: selectedImage }}
                    style={{ width: 192, height: 192 }}
                    contentFit="cover"
                  />
                </View>
              </View>
            )}

            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={handleCancelImage}
                disabled={isUpdatingPicture}
                className={`flex-1 rounded-lg py-3 items-center ${appliedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}
                activeOpacity={0.7}
              >
                <Text variant="body" weight="semibold" style={{ color: appliedTheme === 'dark' ? '#fff' : '#374151' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleConfirmImage}
                disabled={isUpdatingPicture}
                className="flex-1 bg-blue-500 rounded-lg py-3 items-center flex-row justify-center"
                activeOpacity={0.7}
              >
                {isUpdatingPicture ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="check" size={20} color="#fff" style={{ marginRight: 6 }} />
                    <Text variant="body" weight="semibold" className="text-white">
                      Next
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
