import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Course } from '@/lib/api';

const ENROLLED_COURSES_KEY = '@enrolled_courses';

interface EnrolledCourse extends Course {
  enrolledAt: string;
  progress: number;
  completedModules?: number[]; 
}

export function useEnrolledCourses() {
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadEnrolledCourses();
  }, []);

  const loadEnrolledCourses = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const data = await AsyncStorage.getItem(ENROLLED_COURSES_KEY);
      if (data) {
        const courses = JSON.parse(data);
        setEnrolledCourses(courses);
      }
    } catch (error) {
      console.error('Error loading enrolled courses:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const saveEnrolledCourses = async (courses: EnrolledCourse[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(ENROLLED_COURSES_KEY, JSON.stringify(courses));
      setEnrolledCourses(courses);
    } catch (error) {
      console.error('Error saving enrolled courses:', error);
      throw error;
    }
  };

  const enrollCourse = useCallback(async (course: Course): Promise<void> => {
    try {
      const courseId = String(course.id);
      
    
      const isAlreadyEnrolled = enrolledCourses.some(
        c => String(c.id) === courseId
      );
      
      if (isAlreadyEnrolled) {
        return;
      }

      const newEnrolledCourse: EnrolledCourse = {
        ...course,
        enrolledAt: new Date().toISOString(),
        progress: 0,
      };

      const updatedCourses = [...enrolledCourses, newEnrolledCourse];
      await saveEnrolledCourses(updatedCourses);
    } catch (error) {
      console.error('Error enrolling course:', error);
      throw error;
    }
  }, [enrolledCourses]);


  const isEnrolled = useCallback((courseId: string): boolean => {
    return enrolledCourses.some(c => String(c.id) === courseId);
  }, [enrolledCourses]);

  const updateProgress = useCallback(async (courseId: string, progress: number, completedModules?: number[]): Promise<void> => {
    try {
      const updatedCourses = enrolledCourses.map(course => {
        if (String(course.id) === courseId) {
          return { 
            ...course, 
            progress: Math.min(100, Math.max(0, progress)),
            completedModules: completedModules || course.completedModules || []
          };
        }
        return course;
      });
      await saveEnrolledCourses(updatedCourses);
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  }, [enrolledCourses]);

  const getEnrolledCount = useCallback((): number => {
    return enrolledCourses.length;
  }, [enrolledCourses]);

  const getAverageProgress = useCallback((): number => {
    if (enrolledCourses.length === 0) return 0;
    const totalProgress = enrolledCourses.reduce((sum, course) => sum + course.progress, 0);
    return Math.round(totalProgress / enrolledCourses.length);
  }, [enrolledCourses]);

  return {
    enrolledCourses,
    isLoading,
    enrollCourse,
    isEnrolled,
    updateProgress,
    getEnrolledCount,
    getAverageProgress,
    loadEnrolledCourses,
  };
}
