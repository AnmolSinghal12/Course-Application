import { useState, useMemo, useCallback } from 'react';
import { View, RefreshControl, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CourseItem } from '@/components/course/course-item';
import { useCourses } from '@/hooks/use-courses';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { usePreferences } from '@/contexts/preferences-context';
import { Course, Instructor } from '@/lib/api';

export default function CoursesScreen() {
  const router = useRouter();
  const { courses, instructors, isLoading, error, refresh } = useCourses();
  const { isBookmarked, toggleBookmark, bookmarkedCount } = useBookmarks();
  const { preferences } = usePreferences();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const theme = preferences.theme || 'light';
  const appliedTheme = theme === 'auto' ? 'light' : theme;

  // Optimized pull-to-refresh with useCallback to prevent re-renders
  const onRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  // Optimized filter with useMemo to prevent unnecessary recalculations
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) {
      return courses;
    }
    const query = searchQuery.toLowerCase();
    return courses.filter((course: Course) => {
      const title = (course.title || course.name || '').toLowerCase();
      const description = (course.description || '').toLowerCase();
      const category = (course.category || '').toLowerCase();
      return title.includes(query) || description.includes(query) || category.includes(query);
    });
  }, [courses, searchQuery]);

  // Memoized instructor name getter
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

  // Memoized instructor image getter
  const getInstructorImage = useCallback((index: number): string | undefined => {
    return instructors[index]?.picture?.large || 
           instructors[index]?.picture?.medium || 
           instructors[index]?.picture?.thumbnail;
  }, [instructors]);

  // Optimized bookmark handler with useCallback
  const handleBookmarkPress = useCallback(async (course: Course, event: any, index: number): Promise<void> => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    // Ensure consistent course ID - prefer course.id, fallback to index
    const courseId = course.id ? String(course.id) : String(index);
    if (!courseId || courseId === 'undefined' || courseId === 'null') {
      return;
    }
    await toggleBookmark(courseId);
  }, [toggleBookmark]);

  // Optimized course press handler with useCallback
  const handleCoursePress = useCallback((course: Course, index: number): void => {
    const courseId = String(course.id || index);
    router.push({
      pathname: '/course-details',
      params: {
        courseId,
        courseIndex: index.toString(),
      },
    });
  }, [router]);

  // Optimized render function with useCallback
  const renderCourseItem = useCallback(({ item: course, index }: { item: Course; index: number }) => {
    const courseId = String(course.id || index);
    const bookmarked = isBookmarked(courseId);
    const instructorImage = getInstructorImage(index);
    const instructorName = getInstructorName(index);

    return (
      <CourseItem
        course={course}
        index={index}
        bookmarked={bookmarked}
        instructorImage={instructorImage}
        instructorName={instructorName}
        onPress={handleCoursePress}
        onBookmarkPress={(course, event) => handleBookmarkPress(course, event, index)}
      />
    );
  }, [isBookmarked, getInstructorImage, getInstructorName, handleCoursePress, handleBookmarkPress, bookmarkedCount]);

  // Optimized keyExtractor with useCallback
  const keyExtractor = useCallback((item: Course, index: number): string => {
    return String(item.id || index);
  }, []);

  return (
    <View 
      style={{ 
        flex: 1, 
        backgroundColor: appliedTheme === 'dark' ? '#111827' : '#ffffff' 
      }}
    >
      <StatusBar style={appliedTheme === 'dark' ? 'light' : 'auto'} />
      <View 
        style={{ 
          paddingHorizontal: 16, 
          paddingTop: 24, 
          paddingBottom: 16,
          backgroundColor: appliedTheme === 'dark' ? '#111827' : '#ffffff' 
        }}
      >
        <Text variant="heading" size="3xl" className="mb-4" style={{ color: appliedTheme === 'dark' ? '#ffffff' : '#111827' }}>
          Courses
        </Text>
        <Input
          placeholder="Search courses..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="mb-4"
        />
      </View>
      <FlatList
        data={filteredCourses}
        renderItem={renderCourseItem}
        keyExtractor={keyExtractor}
        extraData={bookmarkedCount}
        style={{ backgroundColor: appliedTheme === 'dark' ? '#111827' : '#ffffff' }}
        contentContainerStyle={{ 
          paddingHorizontal: 16, 
          paddingBottom: 16,
          backgroundColor: appliedTheme === 'dark' ? '#111827' : '#ffffff'
        }}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
        // Optimized pull-to-refresh
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
              <Text color="secondary">Loading courses...</Text>
            </View>
          ) : error ? (
            <Card className="mb-4 bg-yellow-50">
              <Text color="error" className="text-center mb-2">
                {error}
              </Text>
              <Text variant="caption" color="muted" className="text-center">
                Courses count: {courses.length} | Filtered: {filteredCourses.length}
              </Text>
              <Text variant="caption" color="secondary" className="text-center mt-2">
                Pull down to refresh
              </Text>
            </Card>
          ) : (
            <Card className="mb-4">
              <Text color="secondary" className="text-center">
                {searchQuery ? 'No courses found matching your search' : 'No courses available'}
              </Text>
              <Text variant="caption" color="muted" className="text-center mt-2">
                Courses count: {courses.length} | Filtered: {filteredCourses.length}
              </Text>
              <Text variant="caption" color="secondary" className="text-center mt-2">
                Pull down to refresh
              </Text>
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
