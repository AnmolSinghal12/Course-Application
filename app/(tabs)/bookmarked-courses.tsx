import { useState, useMemo, useCallback } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CourseItem } from '@/components/course/course-item';
import { useCourses } from '@/hooks/use-courses';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { usePreferences } from '@/contexts/preferences-context';
import { Course } from '@/lib/api';

export default function BookmarkedCoursesScreen() {
  const router = useRouter();
  const { courses, instructors, isLoading, error, refresh } = useCourses();
  const { getBookmarkedIds, isBookmarked, toggleBookmark, bookmarkedCount, loadBookmarks } = useBookmarks();
  const { preferences } = usePreferences();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const theme = preferences.theme || 'light';
  const appliedTheme = theme === 'auto' ? 'light' : theme;

  const bookmarkedCourseIds = useMemo(() => {
    const ids = getBookmarkedIds();
    return ids;
  }, [bookmarkedCount, getBookmarkedIds]);
  
  const bookmarkedCourses = useMemo(() => {
    if (!courses.length || !bookmarkedCourseIds.length) {
      return [];
    }
    const filtered = courses.filter((course: Course, index: number) => {
      const courseId = course.id ? String(course.id) : String(index);
      if (!courseId || courseId === 'undefined' || courseId === 'null') {
        return false;
      }
      return bookmarkedCourseIds.includes(courseId);
    });
    return filtered;
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
      let isMounted = true;
      
      const reloadData = async () => {
        if (!isMounted) return;
        
        try {
          await loadBookmarks();
        } catch (error) {
          console.error('Error reloading bookmarks:', error);
        }
        
        if (isMounted && !isLoading && courses.length === 0) {
          refresh();
        }
      };
      
      const timeoutId = setTimeout(() => {
        reloadData();
      }, 100);
      
      return () => {
        isMounted = false;
        clearTimeout(timeoutId);
      };
    }, [isLoading, courses.length, refresh])
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

  const getInstructorImage = useCallback((course: Course): string | undefined => {
    const courseIndex = courses.findIndex(c => String(c.id) === String(course.id));
    return instructors[courseIndex]?.picture?.large || 
           instructors[courseIndex]?.picture?.medium || 
           instructors[courseIndex]?.picture?.thumbnail;
    }, [instructors, courses]);

  const handleCoursePress = useCallback((course: Course, index: number): void => {
    const courseIndex = courses.findIndex(c => {
      const cId = c.id ? String(c.id) : String(courses.indexOf(c));
      const courseId = course.id ? String(course.id) : String(index);
      return cId === courseId;
    });
    router.push({
      pathname: '/course-details',
      params: {
        courseId: course.id ? String(course.id) : String(index),
        courseIndex: courseIndex >= 0 ? courseIndex.toString() : index.toString(),
      },
    });
  }, [router, courses]);

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

  const renderCourseItem = ({ item: course, index }: { item: Course; index: number }) => {
    const originalIndex = courses.findIndex(c => {
      const cId = c.id ? String(c.id) : String(courses.indexOf(c));
      const courseId = course.id ? String(course.id) : String(courses.indexOf(course));
      return cId === courseId;
    });
    
    const courseId = course.id ? String(course.id) : (originalIndex >= 0 ? String(originalIndex) : String(index));
    
    const bookmarked = isBookmarked(courseId);
    const instructorImage = getInstructorImage(course);
    const instructorName = getInstructorName(course);

    return (
      <CourseItem
        course={course}
        index={originalIndex >= 0 ? originalIndex : index}
        bookmarked={bookmarked}
        instructorImage={instructorImage}
        instructorName={instructorName}
        onPress={(course) => handleCoursePress(course, originalIndex >= 0 ? originalIndex : index)}
        onBookmarkPress={(course, event) => handleBookmarkPress(course, event, originalIndex >= 0 ? originalIndex : index)}
      />
    );
  };

  const keyExtractor = useCallback((item: Course, index: number): string => {
    return `bookmarked-${item.id || index}`;
  }, []);

  return (
    <View className={`flex-1 ${appliedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      <StatusBar style={appliedTheme === 'dark' ? 'light' : 'auto'} />
      <View className="px-4 pt-6 pb-4">
        <Text variant="heading" size="3xl" className="mb-4" style={{ color: appliedTheme === 'dark' ? '#fff' : '#111827' }}>
          Bookmarked Courses
        </Text>
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
        extraData={`${bookmarkedCount}-${bookmarkedCourses.length}-${filteredCourses.length}`}
        style={{ backgroundColor: appliedTheme === 'dark' ? '#111827' : '#ffffff' }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 16,
          backgroundColor: appliedTheme === 'dark' ? '#111827' : '#ffffff',
        }}
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
                {searchQuery && (
                  <Text variant="heading" size="2xl" className="mb-2">
                    🔍
                  </Text>
                )}
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
