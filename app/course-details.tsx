import { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCourses } from '@/hooks/use-courses';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { useEnrolledCourses } from '@/hooks/use-enrolled-courses';
import { Course, Instructor } from '@/lib/api';

export default function CourseDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { courses, instructors, isLoading } = useCourses();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { enrollCourse, isEnrolled } = useEnrolledCourses();
  
  const courseIndex = parseInt(params.courseIndex as string) || 0;
  const courseIdParam = params.courseId as string;
  
  let course: Course | undefined = courses[courseIndex];
  if (!course && courseIdParam) {
    course = courses.find(c => String(c.id) === courseIdParam);
  }
  
  const instructor: Instructor | undefined = instructors[courseIndex];
  
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);
  const [bookmarked, setBookmarked] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  useEffect(() => {
    if (course) {
      const courseId = String(course.id || courseIndex);
      setBookmarked(isBookmarked(courseId));
    } else {
    }
  }, [course, courseIndex, isBookmarked]);
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4" color="secondary">Loading course details...</Text>
      </View>
    );
  }

  if (!course) {
    console.error('Course not found!', {
      courseIndex,
      courseIdParam,
      coursesLength: courses.length,
      courses: courses.map(c => ({ id: c.id, title: c.title || c.name }))
    });
    
    return (
      <View className="flex-1 justify-center items-center bg-white px-6">
        <Text variant="heading" size="2xl" className="mb-4" color="error">
          Course Not Found
        </Text>
        <Text variant="body" color="secondary" className="mb-6 text-center">
          The course you're looking for doesn't exist or has been removed.
        </Text>
        <Text variant="caption" color="muted" className="mb-4 text-center">
          Index: {courseIndex} | ID: {courseIdParam || 'N/A'} | Total Courses: {courses.length}
        </Text>
        <Button onPress={() => router.back()}>
          Go Back
        </Button>
      </View>
    );
  }

  const courseId = String(course.id || courseIndex);
  const isCourseEnrolled = isEnrolled(courseId);

  const getInstructorName = (): string => {
    if (!instructor) return 'Instructor';
    if (typeof instructor.name === 'object' && instructor.name.first && instructor.name.last) {
      return `${instructor.name.first} ${instructor.name.last}`;
    }
    if (typeof instructor.name === 'string') {
      return instructor.name;
    }
    return instructor.login?.username || 'Instructor';
  };

  const getInstructorImage = (): string | undefined => {
    return instructor?.picture?.large || 
           instructor?.picture?.medium || 
           instructor?.picture?.thumbnail;
  };

  const handleBookmarkToggle = async (): Promise<void> => {
    try {
      const newBookmarked = await toggleBookmark(courseId);
      setBookmarked(newBookmarked);
      Alert.alert(
        newBookmarked ? 'Bookmarked' : 'Removed from Bookmarks',
        newBookmarked 
          ? 'Course has been added to your bookmarks' 
          : 'Course has been removed from your bookmarks'
      );
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      Alert.alert('Error', 'Failed to update bookmark');
    }
  };

  const handleEnroll = async (): Promise<void> => {
    if (!course) return;
    
    try {
      setIsEnrolling(true);
      await enrollCourse(course);
      Alert.alert(
        'Success!',
        'You have successfully enrolled in this course',
        [
          {
            text: 'OK',
            onPress: () => {
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error enrolling:', error);
      Alert.alert('Error', 'Failed to enroll in course. Please try again.');
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="auto" />
      <ScrollView className="flex-1">
        {(() => {
          const imageUri = course.thumbnail || course.image || (course.images && course.images.length > 0 ? course.images[0] : null);
          
          return imageUri && !imageError ? (
            <View style={{ width: '100%', height: 256, backgroundColor: '#E5E7EB' }}>
              <ExpoImage
                source={{ uri: imageUri }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
                recyclingKey={String(course.id || courseIndex)}
                onError={() => {
                  setImageError(true);
                }}
                onLoad={() => {
                  setImageError(false);
                }}
              />
            </View>
          ) : (
            <View className="w-full h-64 bg-gray-200 items-center justify-center">
              <Text variant="heading" size="4xl" color="muted">
                {course.title?.charAt(0) || course.name?.charAt(0) || '📚'}
              </Text>
            </View>
          );
        })()}

        <View className="px-6 py-6">
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1 mr-4">
              <Text variant="heading" size="3xl" className="mb-2">
                {course.title || course.name || 'Course'}
              </Text>
              {course.category && (
                <View className="bg-blue-100 px-3 py-1 rounded-full self-start">
                  <Text variant="caption" color="primary" weight="semibold">
                    {course.category}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={handleBookmarkToggle}
              className="p-3 bg-gray-100 rounded-full"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons 
                name={bookmarked ? 'bookmark' : 'bookmark-border'} 
                size={28} 
                color={bookmarked ? '#3B82F6' : '#9CA3AF'} 
              />
            </TouchableOpacity>
          </View>

          {instructor && (
            <Card className="mb-4">
              <View className="flex-row items-center">
                {getInstructorImage() && (
                  <ExpoImage
                    source={{ uri: getInstructorImage() }}
                    style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                )}
                <View className="flex-1">
                  <Text variant="label" color="secondary" className="mb-1">
                    Instructor
                  </Text>
                  <Text variant="body" weight="semibold">
                    {getInstructorName()}
                  </Text>
                </View>
              </View>
            </Card>
          )}
          <View className="flex-row items-center justify-between mb-4">
            {course.price && (
              <View>
                <Text variant="label" color="secondary" className="mb-1">
                  Price
                </Text>
                <Text variant="heading" size="2xl" color="primary">
                  ${course.price}
                </Text>
              </View>
            )}
            {(() => {
              const ratingValue = typeof course.rating === 'number' 
                ? course.rating 
                : course.rating?.rate;
              const ratingCount = typeof course.rating === 'object' 
                ? course.rating?.count || 0 
                : 0;
              
              return ratingValue ? (
                <View className="items-end">
                  <Text variant="label" color="secondary" className="mb-1">
                    Rating
                  </Text>
                  <View className="flex-row items-center">
                    <Text variant="heading" size="xl">
                      ⭐ {ratingValue}
                    </Text>
                    {ratingCount > 0 && (
                      <Text variant="caption" color="secondary" className="ml-2">
                        ({ratingCount} reviews)
                      </Text>
                    )}
                  </View>
                </View>
              ) : null;
            })()}
          </View>

          {course.description && (
            <Card className="mb-4">
              <Text variant="heading" size="xl" className="mb-3">
                About This Course
              </Text>
              <Text variant="body" color="secondary" className="leading-6">
                {course.description}
              </Text>
            </Card>
          )}

          <Card className="mb-4">
            <Text variant="heading" size="xl" className="mb-3">
              Course Details
            </Text>
            <View className="space-y-3">
              {course.category && (
                <View className="flex-row justify-between">
                  <Text variant="body" color="secondary">Category</Text>
                  <Text variant="body" weight="semibold">{course.category}</Text>
                </View>
              )}
              {(() => {
                const ratingValue = typeof course.rating === 'number' 
                  ? course.rating 
                  : course.rating?.rate;
                const ratingCount = typeof course.rating === 'object' 
                  ? course.rating?.count 
                  : undefined;
                
                return (
                  <>
                    {ratingValue && (
                      <View className="flex-row justify-between">
                        <Text variant="body" color="secondary">Rating</Text>
                        <Text variant="body" weight="semibold">
                          {ratingValue} / 5.0
                        </Text>
                      </View>
                    )}
                    {ratingCount && (
                      <View className="flex-row justify-between">
                        <Text variant="body" color="secondary">Total Reviews</Text>
                        <Text variant="body" weight="semibold">{ratingCount}</Text>
                      </View>
                    )}
                  </>
                );
              })()}
            </View>
          </Card>

          <Button
            variant={isCourseEnrolled ? "secondary" : "primary"}
            onPress={handleEnroll}
            disabled={isEnrolling || isCourseEnrolled}
            className="mb-4"
          >
            {isEnrolling ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="#fff" className="mr-2" />
                <Text className="text-white">Enrolling...</Text>
              </View>
            ) : isCourseEnrolled ? (
              'Enrolled ✓'
            ) : (
              'Enroll Now'
            )}
          </Button>

         
          <Button
            variant="secondary"
            onPress={() => {
              router.push({
                pathname: '/course-webview',
                params: {
                  courseId: courseId,
                  courseIndex: courseIndex.toString(),
                },
              });
            }}
            className="mb-6"
          >
            <Text>View Course Content (WebView)</Text>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}
