import React, { memo, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { usePreferences } from '@/contexts/preferences-context';
import { Course, Instructor } from '@/lib/api';

interface CourseItemProps {
  course: Course;
  index: number;
  bookmarked: boolean;
  instructorImage?: string;
  instructorName: string;
  onPress: (course: Course, index: number) => void;
  onBookmarkPress: (course: Course, event: any) => void;
}

export const CourseItem = memo<CourseItemProps>(({
  course,
  index,
  bookmarked,
  instructorImage,
  instructorName,
  onPress,
  onBookmarkPress,
}) => {
  const { preferences } = usePreferences();
  const theme = preferences.theme || 'light';
  const appliedTheme = theme === 'auto' ? 'light' : theme;
  const isDark = appliedTheme === 'dark';
  
  const courseId = String(course.id || index);
  const imageUri = course.thumbnail || course.image || (course.images && course.images.length > 0 ? course.images[0] : null);
  const [imageError, setImageError] = useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [course.thumbnail, course.image]);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(course, index)}
    >
      <Card className="mb-4 overflow-hidden">
        <View className="flex-row">
          {imageUri && !imageError ? (
            <View className="w-32 h-32 rounded-lg mr-4 bg-gray-200 overflow-hidden" style={{ width: 128, height: 128 }}>
              <ExpoImage
                source={{ uri: imageUri }}
                style={{ width: 128, height: 128 }}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
                recyclingKey={courseId}
                onError={() => {
                  setImageError(true);
                }}
                onLoad={() => {
                  setImageError(false);
                }}
              />
            </View>
          ) : (
            <View 
              className="w-32 h-32 rounded-lg mr-4 items-center justify-center" 
              style={{ 
                width: 128, 
                height: 128,
                backgroundColor: isDark ? '#374151' : '#E5E7EB'
              }}
            >
              <Text variant="heading" size="2xl" color="muted" style={{ color: isDark ? '#ffffff' : undefined }}>
                {course.title?.charAt(0) || course.name?.charAt(0) || '📚'}
              </Text>
            </View>
          )}
          <View className="flex-1">
            <View className="flex-row items-start justify-between mb-1">
              <Text variant="heading" size="lg" className="flex-1 mr-2" numberOfLines={2}>
                {course.title || course.name || `Course ${index + 1}`}
              </Text>
              <TouchableOpacity
                onPress={(e) => {
                  if (e) {
                    e.stopPropagation();
                    e.preventDefault();
                  }
                  onBookmarkPress(course, e);
                }}
                onPressIn={(e) => {
                  if (e) {
                    e.stopPropagation();
                  }
                }}
                className="p-2"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <MaterialIcons 
                  name={bookmarked ? 'bookmark' : 'bookmark-border'} 
                  size={24} 
                  color={bookmarked ? '#3B82F6' : '#9CA3AF'} 
                />
              </TouchableOpacity>
            </View>
            {course.description && (
              <Text variant="body" color="secondary" size="sm" className="mb-2" numberOfLines={2}>
                {course.description}
              </Text>
            )}
            <View className="flex-row items-center justify-between mt-2">
              <View className="flex-row items-center flex-1">
                {instructorImage && (
                  <ExpoImage
                    source={{ uri: instructorImage }}
                    style={{ width: 24, height: 24, borderRadius: 12 }}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                )}
                <Text variant="caption" color="secondary" numberOfLines={1}>
                  {instructorName}
                </Text>
              </View>
              {course.price && (
                <Text variant="body" weight="semibold" color="primary" className="ml-2">
                  ${course.price}
                </Text>
              )}
            </View>
            {(() => {
              const ratingValue = typeof course.rating === 'number' 
                ? course.rating 
                : course.rating?.rate;
              const ratingCount = typeof course.rating === 'object' 
                ? course.rating?.count || 0 
                : 0;
              
              return ratingValue ? (
                <View className="flex-row items-center mt-2">
                  <Text variant="caption" color="secondary">
                    ⭐ {ratingValue} {ratingCount > 0 ? `(${ratingCount} reviews)` : ''}
                  </Text>
                </View>
              ) : null;
            })()}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  if (prevProps.bookmarked !== nextProps.bookmarked) {
    return false;
  }
  return (
    prevProps.course.id === nextProps.course.id &&
    prevProps.course.thumbnail === nextProps.course.thumbnail &&
    prevProps.index === nextProps.index &&
    prevProps.instructorImage === nextProps.instructorImage &&
    prevProps.instructorName === nextProps.instructorName
  );
});

CourseItem.displayName = 'CourseItem';
