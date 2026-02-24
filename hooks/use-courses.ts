import { useState, useEffect } from 'react';
import { apiService, Course, Instructor } from '@/lib/api';

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      let coursesData: Course[] = [];
      let instructorsData: Instructor[] = [];
      
      try {
        coursesData = await apiService.getCourses();
      } catch (courseError: any) {
        coursesData = [];
      }
      
      try {
        instructorsData = await apiService.getInstructors();
      } catch (instructorError: any) {
        instructorsData = [];
      }
      
      setCourses(coursesData);
      setInstructors(instructorsData);
      
      if (coursesData.length === 0 && instructorsData.length === 0) {
        setError('No data available. Please check your internet connection and API URL.');
      } else if (coursesData.length === 0) {
        setError('Courses not available. Instructors loaded successfully.');
      } else if (instructorsData.length === 0) {
        setError('Instructors not available. Courses loaded successfully.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      setCourses([]);
      setInstructors([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = async (): Promise<void> => {
    await loadData();
  };

  return {
    courses,
    instructors,
    isLoading,
    error,
    refresh,
  };
}
