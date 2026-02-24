import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKMARKS_KEY = '@course_bookmarks';

interface BookmarksContextType {
  bookmarkedIds: Set<string>;
  isBookmarked: (courseId: string) => boolean;
  toggleBookmark: (courseId: string) => Promise<boolean>;
  getBookmarkedIds: () => string[];
  isLoading: boolean;
  bookmarkedCount: number;
  loadBookmarks: () => Promise<void>;
}

const BookmarksContext = createContext<BookmarksContextType | undefined>(undefined);

export function BookmarksProvider({ children }: { children: ReactNode }) {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isLoadingRef = useRef<boolean>(false);
  const toggleInProgressRef = useRef<Set<string>>(new Set());

  const loadBookmarks = useCallback(async (): Promise<void> => {
    if (isLoadingRef.current) {
      return;
    }
    
    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      const data = await AsyncStorage.getItem(BOOKMARKS_KEY);
      if (data) {
        const bookmarks = JSON.parse(data);
        const newBookmarksSet = new Set<string>(bookmarks);
        setBookmarkedIds(newBookmarksSet);
      } else {
        setBookmarkedIds(new Set());
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      setBookmarkedIds(new Set());
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const toggleBookmark = useCallback(async (courseId: string): Promise<boolean> => {
    const normalizedCourseId = String(courseId).trim();
    
    if (!normalizedCourseId || normalizedCourseId === 'undefined' || normalizedCourseId === 'null') {
      return false;
    }
    
    if (toggleInProgressRef.current.has(normalizedCourseId)) {
      return bookmarkedIds.has(normalizedCourseId);
    }

    try {
      toggleInProgressRef.current.add(normalizedCourseId);
      
      let newBookmarks: Set<string> = new Set();
      let wasBookmarked = false;
      
      setBookmarkedIds((currentBookmarks) => {
        newBookmarks = new Set(currentBookmarks);
        wasBookmarked = newBookmarks.has(normalizedCourseId);
        
        if (wasBookmarked) {
          newBookmarks.delete(normalizedCourseId);
        } else {
          newBookmarks.add(normalizedCourseId);
        }
        
        return new Set(newBookmarks);
      });
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const array = Array.from(newBookmarks);
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(array));
      
      const newCount = newBookmarks.size;
      if (newCount >= 5) {
        const { NotificationService } = await import('@/lib/notifications');
        const hasPermission = await NotificationService.hasPermissions();
        if (hasPermission && newCount === 5) {
          await NotificationService.notifyBookmarkMilestone(newCount);
        }
      }
      
      return !wasBookmarked;
    } catch (error) {
      return bookmarkedIds.has(courseId);
    } finally {
      toggleInProgressRef.current.delete(normalizedCourseId);
    }
  }, [bookmarkedIds]);

  const isBookmarked = useCallback((courseId: string): boolean => {
    if (!courseId || courseId === 'undefined' || courseId === 'null') {
      return false;
    }
    const normalizedCourseId = String(courseId).trim();
    return bookmarkedIds.has(normalizedCourseId);
  }, [bookmarkedIds]);

  const getBookmarkedIds = useCallback((): string[] => {
    return Array.from(bookmarkedIds);
  }, [bookmarkedIds]);

  return (
    <BookmarksContext.Provider
      value={{
        bookmarkedIds,
        isBookmarked,
        toggleBookmark,
        getBookmarkedIds,
        isLoading,
        bookmarkedCount: bookmarkedIds.size,
        loadBookmarks,
      }}
    >
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks(): BookmarksContextType {
  const context = useContext(BookmarksContext);
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarksProvider');
  }
  return context;
}
