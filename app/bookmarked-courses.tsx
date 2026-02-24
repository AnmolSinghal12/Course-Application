import { useState, useMemo, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CourseItem } from '@/components/course/course-item';
import { useCourses } from '@/hooks/use-courses';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { Course } from '@/lib/api';

export default function BookmarkedCoursesScreen() {
  const router = useRouter();
  const { courses, instructors, isLoading, error, refresh } = useCourses();
  const { getBookmarkedIds } = useBookmarks();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Get bookmarked course IDs
  const bookmarkedCourseIds = getBookmarkedIds();
  
  // Filter courses to only show bookmarked ones
  const bookmarkedCourses = useMemo(() => {
    return courses.filter((course: Course) => {
      const courseId = String(course.id);
      return bookmarkedCourseIds.includes(courseId);
    });
  }, [courses, bookmarkedCourseIds]);

 
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) {
      return bookmarkedCourses;
    }
    const query = searchQuery.toLowerCase();
    return bookmarkedCourses.filter((course: Course) => {
      const title = (course.title || course.name || '').toLowerCase();
      const description = (course.description || '').toLowerCase();
      const category = (course.category || '').toLowerCase();
      return title.includes(query) || description.includes(query) || category.includes(query);
    });
  }, [bookmarkedCourses, searchQuery]);

  const onRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  
  const getInstructorName = useCallback((course: Course): string => {
    const courseIndex = courses.findIndex(c => String(c.id) === String(course.id));
    if (instructors[courseIndex]) {
      const instructor = instructors[courseIndex];
      if (typeof instructor.name === 'object' && instructor.name.first && instructor.name.last) {
        return `${instructor.name.first} ${instructor.name.last}`;
      }
      if (typeof instructor.name === 'string') {
        return instructor.name;
      }
      return instructor.login?.username || 'Instructor';
    }
    return 'Instructor';
  }, [instructors, courses]);
// Memoized instructor image getter
  const getInstructorImage = useCallback((course: Course): string | undefined => {
    const courseIndex = courses.findIndex(c => String(c.id) === String(course.id));
    return instructors[courseIndex]?.picture?.large || 
           instructors[courseIndex]?.picture?.medium || 
           instructors[courseIndex]?.picture?.thumbnail;
  }, [instructors, courses]);

 
  const handleCoursePress = useCallback((course: Course): void => {
    const courseIndex = courses.findIndex(c => String(c.id) === String(course.id));
    router.push({
      pathname: '/course-details',
      params: {
        courseId: String(course.id),
        courseIndex: courseIndex >= 0 ? courseIndex.toString() : '0',
      },
    });
  }, [router, courses]);

  
  const handleBookmarkPress = useCallback(async (course: Course, event: any): Promise<void> => {
    event.stopPropagation();
  }, []);

  
  const renderCourseItem = useCallback(({ item: course, index }: { item: Course; index: number }) => {
    const courseId = String(course.id || index);
    const instructorImage = getInstructorImage(course);
    const instructorName = getInstructorName(course);

    return (
      <CourseItem
        course={course}
        index={index}
        bookmarked={true}
        instructorImage={instructorImage}
        instructorName={instructorName}
        onPress={handleCoursePress}
        onBookmarkPress={handleBookmarkPress}
      />
    );
  }, [getInstructorImage, getInstructorName, handleCoursePress, handleBookmarkPress]);
  const keyExtractor = useCallback((item: Course, index: number): string => {
    return `bookmarked-${item.id || index}`;
  }, []);

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="auto" />
      <View className="px-4 pt-6 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text variant="heading" size="3xl">
            Bookmarked Courses
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2"
          >
            <Text variant="heading" size="xl">✕</Text>
          </TouchableOpacity>
        </View>
        <Input
          placeholder="Search bookmarked courses..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="mb-4"
        />
        {bookmarkedCourses.length > 0 && (
          <Text variant="caption" color="secondary" className="mb-2">
            {filteredCourses.length} of {bookmarkedCourses.length} courses
          </Text>
        )}
      </View>
      <FlatList
        data={filteredCourses}
        renderItem={renderCourseItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
            colors={['#3B82F6']}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View className="items-center py-12">
              <Text color="secondary">Loading bookmarked courses...</Text>
            </View>
          ) : error ? (
            <Card className="mb-4 bg-yellow-50">
              <Text color="error" className="text-center mb-2">
                {error}
              </Text>
              <Text variant="caption" color="muted" className="text-center">
                Pull down to refresh
              </Text>
            </Card>
          ) : (
            <Card className="mb-4">
              <View className="items-center py-12">
                <Text variant="heading" size="2xl" className="mb-2">
                  {searchQuery ? '🔍' : 'Bookmark courses to save them for later!'}
                </Text>
                <Text color="secondary" className="text-center mb-2">
                  {searchQuery 
                    ? 'No bookmarked courses found matching your search' 
                    : 'No courses bookmarked yet'}
                </Text>
                <Text variant="caption" color="muted" className="text-center mt-2">
                  {searchQuery 
                    ? 'Try a different search term' 
                    : 'Bookmark courses to save them for later!'}
                </Text>
              </View>
            </Card>
          )
        }
        ListHeaderComponent={
          error ? (
            <Card className="mb-4 bg-red-50">
              <Text color="error" className="mb-2">Error loading data</Text>
              <Text variant="caption" color="error">{error}</Text>
            </Card>
          ) : null
        }
      />
    </View>
  );
}
