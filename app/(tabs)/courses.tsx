import { useState, useMemo, useCallback } from 'react';
import { View, RefreshControl, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
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
  const { isBookmarked, toggleBookmark, bookmarkedCount, getBookmarkedIds } = useBookmarks();
  const { preferences } = usePreferences();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const theme = preferences.theme || 'light';
  const appliedTheme = theme === 'auto' ? 'light' : theme;


  const onRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

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

  const handleBookmarkPress = useCallback(async (course: Course, event: any, index: number): Promise<void> => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const originalIndex = courses.findIndex(c => {
      const cId = c.id ? String(c.id) : String(courses.indexOf(c));
      const courseId = course.id ? String(course.id) : String(courses.indexOf(course));
      return cId === courseId;
    });
    
    const courseId = course.id ? String(course.id) : (originalIndex >= 0 ? String(originalIndex) : String(index));
    
    if (!courseId || courseId === 'undefined' || courseId === 'null') {
      return;
    }
    
    try {
      await toggleBookmark(courseId);
    } catch (error) {
    }
  }, [toggleBookmark, courses]);

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

  const bookmarkedIdsString = useMemo(() => {
    const ids = getBookmarkedIds();
    return ids.sort().join(',');
  }, [bookmarkedCount, getBookmarkedIds]);

  const renderCourseItem = ({ item: course, index }: { item: Course; index: number }) => {
    const originalIndex = courses.findIndex(c => {
      const cId = c.id ? String(c.id) : String(courses.indexOf(c));
      const courseId = course.id ? String(course.id) : String(courses.indexOf(course));
      return cId === courseId;
    });
    
    const courseId = course.id ? String(course.id) : (originalIndex >= 0 ? String(originalIndex) : String(index));
    const bookmarked = isBookmarked(courseId);
    const actualIndex = originalIndex >= 0 ? originalIndex : index;
    const instructorImage = getInstructorImage(actualIndex);
    const instructorName = getInstructorName(actualIndex);

    return (
      <CourseItem
        course={course}
        index={actualIndex}
        bookmarked={bookmarked}
        instructorImage={instructorImage}
        instructorName={instructorName}
        onPress={handleCoursePress}
        onBookmarkPress={(course, event) => handleBookmarkPress(course, event, actualIndex)}
      />
    );
  };

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
        extraData={`${bookmarkedCount}-${bookmarkedIdsString}`}
        style={{ backgroundColor: appliedTheme === 'dark' ? '#111827' : '#ffffff' }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 16,
          backgroundColor: appliedTheme === 'dark' ? '#111827' : '#ffffff',
        }}
        removeClippedSubviews={false}
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
              <Text color="secondary" style={{ color: appliedTheme === 'dark' ? '#ffffff' : undefined }}>Loading courses...</Text>
            </View>
          ) : error ? (
            <Card className="mb-4" style={{ backgroundColor: appliedTheme === 'dark' ? '#1F2937' : '#FEF3C7' }}>
              <Text color="error" className="text-center mb-2" style={{ color: appliedTheme === 'dark' ? '#FCA5A5' : undefined }}>
                {error}
              </Text>
              <Text variant="caption" color="muted" className="text-center" style={{ color: appliedTheme === 'dark' ? '#ffffff' : undefined }}>
                Courses count: {courses.length} | Filtered: {filteredCourses.length}
              </Text>
              <Text variant="caption" color="secondary" className="text-center mt-2" style={{ color: appliedTheme === 'dark' ? '#ffffff' : undefined }}>
                Pull down to refresh
              </Text>
            </Card>
          ) : (
            <Card className="mb-4" style={{ backgroundColor: appliedTheme === 'dark' ? '#1F2937' : '#ffffff' }}>
              <Text color="secondary" className="text-center" style={{ color: appliedTheme === 'dark' ? '#ffffff' : undefined }}>
                {searchQuery ? 'No courses found matching your search' : 'No courses available'}
              </Text>
              <Text variant="caption" color="muted" className="text-center mt-2" style={{ color: appliedTheme === 'dark' ? '#ffffff' : undefined }}>
                Courses count: {courses.length} | Filtered: {filteredCourses.length}
              </Text>
              <Text variant="caption" color="secondary" className="text-center mt-2" style={{ color: appliedTheme === 'dark' ? '#ffffff' : undefined }}>
                Pull down to refresh
              </Text>
            </Card>
          )
        }
        ListHeaderComponent={
          error ? (
            <Card className="mb-4" style={{ backgroundColor: appliedTheme === 'dark' ? '#1F2937' : '#FEE2E2' }}>
              <Text color="error" className="mb-2" style={{ color: appliedTheme === 'dark' ? '#FCA5A5' : undefined }}>Error loading data</Text>
              <Text variant="caption" color="error" style={{ color: appliedTheme === 'dark' ? '#FCA5A5' : undefined }}>{error}</Text>
            </Card>
          ) : null
        }
      />
    </View>
  );
}
