import { useState, useRef, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useCourses } from '@/hooks/use-courses';
import { useEnrolledCourses } from '@/hooks/use-enrolled-courses';
import { Course } from '@/lib/api';

export default function CourseWebViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { courses, isLoading: coursesLoading } = useCourses();
  const { updateProgress, isEnrolled, enrolledCourses, loadEnrolledCourses } = useEnrolledCourses();
  const webViewRef = useRef<WebView>(null);
  
  const courseIndex = parseInt(params.courseIndex as string) || 0;
  const courseIdParam = params.courseId as string;
  
 
  let course: Course | undefined = courses[courseIndex];
  if (!course && courseIdParam) {
    course = courses.find(c => String(c.id) === courseIdParam);
  }
  
  const courseId = course ? String(course.id || courseIndex) : '';
  
  const [webViewLoading, setWebViewLoading] = useState<boolean>(true);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [webViewError, setWebViewError] = useState<string | null>(null);
  const [completedModules, setCompletedModules] = useState<Set<number>>(new Set());
  
  
  useEffect(() => {
    if (courseId && enrolledCourses.length > 0) {
      const enrolledCourse = enrolledCourses.find(c => String(c.id) === courseId);
      if (enrolledCourse && (enrolledCourse as any).completedModules) {
        setCompletedModules(new Set((enrolledCourse as any).completedModules));
      }
    }
  }, [courseId, enrolledCourses]);

  
  useEffect(() => {
    if (course) {
      const html = getInlineHTML();
      setHtmlContent(html);
      setWebViewError(null); 
    }
  }, [course, enrolledCourses]);

  const generateModules = (course: Course): Array<{ title: string; description: string; lessons: Array<{ title: string; duration?: string }> }> => {
    const courseTitle = course.title || course.name || 'Course';
    return [
      {
        title: 'Module 1: Getting Started',
        description: 'Introduction to the course fundamentals and setting up your environment.',
        lessons: [
          { title: 'Welcome to the Course', duration: '5 min' },
          { title: 'Course Overview', duration: '10 min' },
          { title: 'Setting Up Your Environment', duration: '15 min' },
        ]
      },
      {
        title: 'Module 2: Core Concepts',
        description: 'Learn the fundamental concepts and principles of this course.',
        lessons: [
          { title: 'Understanding the Basics', duration: '20 min' },
          { title: 'Key Concepts Explained', duration: '25 min' },
          { title: 'Practical Examples', duration: '30 min' },
        ]
      },
      {
        title: 'Module 3: Advanced Topics',
        description: 'Dive deeper into advanced topics and real-world applications.',
        lessons: [
          { title: 'Advanced Techniques', duration: '35 min' },
          { title: 'Best Practices', duration: '25 min' },
          { title: 'Case Studies', duration: '40 min' },
        ]
      },
      {
        title: 'Module 4: Project & Assessment',
        description: 'Apply what you\'ve learned through hands-on projects and assessments.',
        lessons: [
          { title: 'Final Project Overview', duration: '15 min' },
          { title: 'Building Your Project', duration: '60 min' },
          { title: 'Course Assessment', duration: '30 min' },
        ]
      }
    ];
  };

  
  const TOTAL_MODULES = 4;
  const PROGRESS_PER_MODULE = 100 / TOTAL_MODULES; // 25% per module

  const getInlineHTML = (): string => {
    if (!course) return '<html><body><h1>Course not found</h1></body></html>';

    
    let ratingRate = 0;
    let ratingCount = 0;
    
    if (typeof course.rating === 'number') {
      ratingRate = course.rating;
      ratingCount = 0;
    } else if (course.rating && typeof course.rating === 'object') {
      ratingRate = course.rating.rate ?? 0;
      ratingCount = course.rating.count ?? 0;
    }
    
    const modules = generateModules(course);

    const courseIdForData = String(course.id || courseIndex);

   
    const enrolledCourse = enrolledCourses.find(c => String(c.id) === courseIdForData);
    const completedModulesArray = enrolledCourse?.completedModules || [];
    const completedModulesSet = new Set(completedModulesArray);
    
    const courseData = {
      title: course.title || course.name || 'Course',
      category: course.category || 'General',
      id: course.id || courseIndex,
      price: course.price || 0,
      rating: {
        rate: ratingRate,
        count: ratingCount,
      },
      description: course.description || 'No description available.',
      modules: modules,
      completedModules: completedModulesArray
    };

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Course Content</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 { font-size: 28px; margin-bottom: 10px; }
        .header .meta { font-size: 14px; opacity: 0.9; }
        .content { padding: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 {
            color: #667eea;
            font-size: 22px;
            margin-bottom: 15px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .info-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .info-item label {
            display: block;
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .info-item value {
            display: block;
            font-size: 18px;
            font-weight: bold;
            color: #333;
        }
        .description {
            line-height: 1.8;
            color: #555;
            font-size: 16px;
        }
        .badge {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            margin: 5px 5px 5px 0;
        }
        .rating {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .stars {
            color: #ffc107;
            font-size: 20px;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        .module {
            margin-bottom: 30px;
            border-left: 4px solid #667eea;
            padding-left: 20px;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
        }
        .module.active {
            border-left-color: #3B82F6;
            background: #eff6ff;
        }
        .module.completed {
            border-left-color: #10b981;
            background: #f0fdf4;
        }
        .complete-btn.completed {
            background: #10b981;
            color: white;
            cursor: not-allowed;
            opacity: 0.8;
        }
        .complete-btn:disabled {
            cursor: not-allowed;
            opacity: 0.6;
        }
        .module-title {
            color: #3B82F6;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .module-description {
            color: #666;
            font-size: 14px;
            margin-bottom: 15px;
            line-height: 1.6;
        }
        .lesson {
            display: flex;
            align-items: center;
            padding: 12px;
            margin-bottom: 8px;
            background: white;
            border-radius: 6px;
            border-left: 3px solid #3B82F6;
        }
        .lesson-number {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #3B82F6;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
            margin-right: 12px;
            flex-shrink: 0;
        }
        .lesson-content {
            flex: 1;
        }
        .lesson-title {
            font-weight: 600;
            color: #333;
            font-size: 15px;
        }
        .lesson-duration {
            font-size: 12px;
            color: #666;
            margin-top: 2px;
        }
        .complete-btn {
            display: inline-block;
            padding: 12px 24px;
            margin-top: 15px;
            background: #3B82F6;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .complete-btn:hover {
            background: #2563EB;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
        }
        .complete-btn:active {
            transform: translateY(0);
        }
        .modal-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }
        .modal-overlay.show {
            display: flex;
        }
        .modal {
            background: white;
            border-radius: 16px;
            padding: 30px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
        }
        .modal-title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        .modal-message {
            color: #666;
            font-size: 16px;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        .modal-btn {
            padding: 12px 30px;
            background: #10b981;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .modal-btn:hover {
            background: #059669;
        }
        @media (max-width: 600px) {
            .header h1 { font-size: 22px; }
            .content { padding: 20px; }
            .info-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 id="courseTitle">${courseData.title}</h1>
            <div class="meta">
                <span id="courseCategory">${courseData.category}</span> • 
                <span id="courseId">ID: ${courseData.id}</span>
            </div>
        </div>
        <div class="content">
            <div class="section">
                <h2>Course Information</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <label>Price</label>
                        <value id="coursePrice">$${courseData.price}</value>
                    </div>
                    <div class="info-item">
                        <label>Rating</label>
                        <div class="rating">
                            <span class="stars" id="courseStars">${'⭐'.repeat(Math.round(courseData.rating.rate || 0))}</span>
                            <span id="courseRating">${(courseData.rating.rate || 0).toFixed(1)} / 5.0</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <label>Reviews</label>
                        <value id="courseReviews">${courseData.rating.count || 0} reviews</value>
                    </div>
                    <div class="info-item">
                        <label>Category</label>
                        <value id="courseCategoryValue">${courseData.category}</value>
                    </div>
                </div>
            </div>
            <div class="section">
                <h2>About This Course</h2>
                <p class="description" id="courseDescription">${courseData.description}</p>
            </div>
            <div class="section">
                <h2>Course Modules</h2>
                ${courseData.modules.map((module, moduleIndex) => {
                    const isCompleted = courseData.completedModules.includes(moduleIndex);
                    return `
                    <div class="module ${moduleIndex === 0 ? 'active' : ''} ${isCompleted ? 'completed' : ''}">
                        <div class="module-title">
                            ${module.title}
                            ${isCompleted ? '<span style="color: #10b981; margin-left: 10px; font-weight: normal;">✓ Completed</span>' : ''}
                        </div>
                        <div class="module-description">${module.description}</div>
                        ${module.lessons.map((lesson, lessonIndex) => `
                            <div class="lesson">
                                <div class="lesson-number">${lessonIndex + 1}</div>
                                <div class="lesson-content">
                                    <div class="lesson-title">${lesson.title}</div>
                                    ${lesson.duration ? `<div class="lesson-duration">Duration: ${lesson.duration}</div>` : ''}
                                </div>
                            </div>
                        `).join('')}
                        <button class="complete-btn ${isCompleted ? 'completed' : ''}" 
                                onclick="markModuleCompleted(${moduleIndex})"
                                ${isCompleted ? 'disabled' : ''}>
                            ${isCompleted ? '✓ Completed' : 'Mark as Completed'}
                        </button>
                    </div>
                `;
                }).join('')}
            </div>
        </div>
        <div class="footer">
            <p>Course content loaded from Native App</p>
            <p id="loadTime">Loaded at: ${new Date().toLocaleString()}</p>
        </div>
    </div>
    <div class="modal-overlay" id="completionModal">
        <div class="modal">
            <div class="modal-title">
                Course Completed! 🎓
            </div>
            <div class="modal-message">
                Great job! Your progress has been updated.
            </div>
            <button class="modal-btn" onclick="closeCompletionModal()">OK</button>
        </div>
    </div>
    <script>
        // Store course data in window object
        window.courseData = ${JSON.stringify(courseData)};
        
        window.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'courseData') {
                updateCourseContent(event.data.course);
            }
        });
        
        // Function to update course content dynamically
        function updateCourseContent(course) {
            if (course.title || course.name) {
                const titleEl = document.getElementById('courseTitle');
                if (titleEl) titleEl.textContent = course.title || course.name;
            }
            if (course.category) {
                const catEl = document.getElementById('courseCategory');
                if (catEl) catEl.textContent = course.category;
            }
            if (course.price) {
                const priceEl = document.getElementById('coursePrice');
                if (priceEl) priceEl.textContent = '$' + course.price;
            }
            if (course.description) {
                const descEl = document.getElementById('courseDescription');
                if (descEl) descEl.textContent = course.description;
            }
        }
        
        // Mark module as completed
        function markModuleCompleted(moduleIndex) {
            // Show completion modal
            const modal = document.getElementById('completionModal');
            if (modal) {
                modal.classList.add('show');
            }
            
            // Send message to Native app
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'moduleCompleted',
                    courseId: window.courseData.id,
                    moduleIndex: moduleIndex,
                    timestamp: new Date().toISOString()
                }));
            }
        }
        
        // Close completion modal
        function closeCompletionModal() {
            const modal = document.getElementById('completionModal');
            if (modal) {
                modal.classList.remove('show');
            }
        }
        
        // Close modal when clicking outside
        document.getElementById('completionModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeCompletionModal();
            }
        });
        
        // Send message to Native app when page loads
        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'courseLoaded',
                courseId: window.courseData.id,
                timestamp: new Date().toISOString()
            }));
        }
    </script>
</body>
</html>`;
  };

  
  const handleWebViewMessage = async (event: WebViewMessageEvent): Promise<void> => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'courseLoaded') {
      } else if (data.type === 'moduleCompleted') {
        if (!courseId) {
          return;
        }
        
        if (!isEnrolled(courseId)) {
          return;
        }
        
        const moduleIndex = data.moduleIndex;
        if (moduleIndex === undefined || moduleIndex === null) {
          return;
        }
        
        const newCompletedModules = new Set(completedModules);
        if (!newCompletedModules.has(moduleIndex)) {
          newCompletedModules.add(moduleIndex);
          setCompletedModules(newCompletedModules);
          
          const newProgress = Math.min(100, newCompletedModules.size * PROGRESS_PER_MODULE);
          
          const completedModulesArray = Array.from(newCompletedModules);
          
          await updateProgress(courseId, newProgress, completedModulesArray);
          
          await loadEnrolledCourses();
        }
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

 
  const injectedJavaScript = course ? `
    (function() {
      const courseData = ${JSON.stringify(course)};
      window.courseData = courseData;
      
      // Update page content
      if (document.getElementById('courseTitle')) {
        document.getElementById('courseTitle').textContent = courseData.title || courseData.name || 'Course';
      }
      if (document.getElementById('courseCategory')) {
        document.getElementById('courseCategory').textContent = courseData.category || 'General';
      }
      if (document.getElementById('courseId')) {
        document.getElementById('courseId').textContent = 'ID: ' + (courseData.id || '--');
      }
      if (document.getElementById('coursePrice')) {
        document.getElementById('coursePrice').textContent = '$' + (courseData.price || 0);
      }
      if (document.getElementById('courseDescription')) {
        document.getElementById('courseDescription').textContent = courseData.description || 'No description available.';
      }
      
      // Send message back to Native app
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'courseLoaded',
        courseId: courseData.id
      }));
    })();
    true;
  ` : '';

  if (coursesLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4" color="secondary">Loading course content...</Text>
      </View>
    );
  }

  if (!course) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-6">
        <Text variant="heading" size="2xl" className="mb-4" color="error">
          Course Not Found
        </Text>
        <Button onPress={() => router.back()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="auto" />
      <WebView
        ref={webViewRef}
        source={{ 
          html: htmlContent || getInlineHTML(),
          // Pass course data via headers (header-based communication)
          headers: course ? {
            'X-Course-Id': String(course.id || courseIndex),
            'X-Course-Title': course.title || course.name || 'Course',
            'X-Course-Category': course.category || 'General',
            'X-Course-Data': JSON.stringify(course),
          } : {}
        }}
        style={{ flex: 1 }}
        onLoadStart={() => {
          setWebViewLoading(true);
          setWebViewError(null);
        }}
        onLoadEnd={() => {
          setWebViewLoading(false);
          setWebViewError(null);
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          setWebViewError('Failed to load course content. Please try again.');
          setWebViewLoading(false);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          setWebViewError(`Failed to load content (HTTP ${nativeEvent.statusCode}). Please check your connection.`);
          setWebViewLoading(false);
        }}
        onMessage={handleWebViewMessage}
        injectedJavaScript={injectedJavaScript}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        webviewDebuggingEnabled={__DEV__}
        renderLoading={() => (
          <View className="flex-1 justify-center items-center bg-white">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="mt-4" color="secondary">Loading course content...</Text>
          </View>
        )}
      />
      {webViewError && (
        <View className="absolute inset-0 justify-center items-center bg-white/95 px-6">
          <Text variant="heading" size="xl" color="error" className="mb-2 text-center">
            ⚠️ Error Loading Content
          </Text>
          <Text color="secondary" className="mb-4 text-center">
            {webViewError}
          </Text>
          <Button
            onPress={() => {
              setWebViewError(null);
              webViewRef.current?.reload();
            }}
            variant="primary"
          >
            <Text className="text-white">Retry</Text>
          </Button>
        </View>
      )}
      {webViewLoading && (
        <View className="absolute inset-0 justify-center items-center bg-white/80">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4" color="secondary">Loading...</Text>
        </View>
      )}
    </View>
  );
}
