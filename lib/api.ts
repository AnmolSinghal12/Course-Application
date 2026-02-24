import { retryWithBackoff, withTimeout, ErrorHandler } from './error-handler';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.freeapi.app';
const API_TIMEOUT = 10000;
const MAX_RETRIES = 3;

if (!API_BASE_URL || API_BASE_URL === 'https://your-api-domain.com') {
}

export interface LoginRequest {
  email?: string;
  username?: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  role?: string; 
}

export interface AuthResponse {
  data?: {
    user: User;
    accessToken?: string;
    refreshToken?: string;
  };
  user?: User; 
  token?: string;
  refreshToken?: string;
  message?: string;
  statusCode?: number;
  success?: boolean;
}

export interface User {
  _id?: string;
  id?: string; 
  email: string;
  username?: string;
  name?: string; 
  avatar?: {
    _id?: string;
    localPath?: string;
    url?: string;
  };
  profilePicture?: string; 
  role?: string;
  isEmailVerified?: boolean;
  loginType?: string;
  createdAt?: string;
  updatedAt?: string;
  coursesEnrolled?: number;
  progress?: number;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken?: string;
}

export interface Instructor {
  id?: {
    name?: string;
    value?: string;
  };
  name?: {
    title?: string;
    first?: string;
    last?: string;
  } | string;
  email?: string;
  picture?: {
    large?: string;
    medium?: string;
    thumbnail?: string;
  };
  login?: {
    username?: string;
  };
  [key: string]: any; 
}

export interface Course {
  id?: number | string;
  title?: string;
  name?: string; 
  description?: string;
  price?: number;
  image?: string; 
  thumbnail?: string; 
  images?: string[]; 
  category?: string;
  rating?: number | { 
    rate?: number;
    count?: number;
  };
  [key: string]: any;
}

export interface RandomUsersResponse {
  data?: {
    data?: Instructor[];
    currentPageItems?: number;
    limit?: number;
    page?: number;
    nextPage?: boolean;
    previousPage?: boolean;
    totalItems?: number;
    totalPages?: number;
  } | Instructor[];
  results?: Instructor[];
  message?: string;
  statusCode?: number;
  success?: boolean;
  [key: string]: any;
}

export interface RandomProductsResponse {
  data?: {
    data?: Course[];
    currentPageItems?: number;
    limit?: number;
    page?: number;
    nextPage?: boolean;
    previousPage?: boolean;
    totalItems?: number;
    totalPages?: number;
  } | Course[];
  products?: Course[];
  message?: string;
  statusCode?: number;
  success?: boolean;
  [key: string]: any;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private convertDummyJsonUrl(url: string | undefined): string | undefined {
    return url;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retry: boolean = true
  ): Promise<T> {
    
    if (!this.baseUrl || this.baseUrl === 'https://your-api-domain.com') {
      const error = new Error('API URL not configured. Please set EXPO_PUBLIC_API_URL in .env file or update lib/api.ts');
      throw ErrorHandler.categorizeError(error);
    }
    
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

  
    const fetchWithTimeout = async (): Promise<Response> => {
      return withTimeout(
        fetch(url, config),
        API_TIMEOUT,
        'Request timed out. Please check your connection and try again.'
      );
    };

    const executeRequest = async (): Promise<T> => {
      try {
        const response = await fetchWithTimeout();
      
      const responseText = await response.text();
      
      if (responseText.trim().startsWith('<')) {
        throw new Error(`API endpoint not found or returned HTML. Please check if the endpoint "${endpoint}" is correct.`);
      }
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          const is401Error = response.status === 401;
          const isInvalidToken = errorData.message?.includes('Invalid access token') || errorData.message?.includes('Invalid token');
          const shouldSuppressError = endpoint.includes('/refresh-token') || 
                                     endpoint.includes('/login') || 
                                     endpoint.includes('/profile/picture') || 
                                     endpoint.includes('/profile') || 
                                     endpoint.endsWith('/profile') ||
                                     endpoint.includes('/statistics') ||
                                     endpoint.includes('/me') ||
                                     (is401Error && isInvalidToken);
          
          if (!shouldSuppressError) {
          }
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

        const parsedResponse = JSON.parse(responseText);
        return parsedResponse;
      } catch (parseError: any) {
        if (parseError.message.includes('JSON Parse error') || parseError.message.includes('Unexpected token')) {
          throw new Error(`Invalid response from server. The API endpoint may not exist or returned an error page. Endpoint: ${endpoint}`);
        }
        throw parseError;
      }
    };

    try {
      if (retry) {
        return await retryWithBackoff(executeRequest, MAX_RETRIES);
      } else {
        return await executeRequest();
      }
    } catch (error: any) {
      const appError = ErrorHandler.categorizeError(error);
      throw appError;
    }
  }
  private async authenticatedRequest<T>(
    endpoint: string,
    token: string,
    options: RequestInit = {},
    retry: boolean = true
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    }, retry);
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    if (!credentials.password) {
      throw new Error('Password is required');
    }

    if (!credentials.username) {
      throw new Error('Username is required');
    }

    const trimmedUsername = credentials.username.trim();
    const requestBody = {
      username: trimmedUsername,
      password: credentials.password,
    };
    
    const response = await this.request<AuthResponse>('/api/v1/users/login', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
    
    const responseAny = response as any;
    const transformedResponse: AuthResponse = {
      ...response,
    };
    
    if (response.data?.user) {
      transformedResponse.user = response.data.user;
      transformedResponse.token = response.data.accessToken || response.token || responseAny.data?.token;
      transformedResponse.refreshToken = response.data.refreshToken || response.refreshToken || responseAny.data?.refreshToken;
    } else if (response.user) {
      transformedResponse.user = response.user;
      transformedResponse.token = response.token || responseAny.accessToken || responseAny.data?.accessToken;
      transformedResponse.refreshToken = response.refreshToken || responseAny.data?.refreshToken;
    } else if (responseAny.data) {
      const data = responseAny.data;
      if (data.user || data.id || data.email) {
        transformedResponse.user = data.user || data;
        transformedResponse.token = data.accessToken || data.token || response.token || responseAny.token;
        transformedResponse.refreshToken = data.refreshToken || response.refreshToken || responseAny.refreshToken;
      }
    }
    
    return transformedResponse;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/v1/users/register', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        username: data.username,
        role: data.role || 'USER', 
      }),
    });
    
    const responseAny = response as any;
    const transformedResponse: AuthResponse = {
      ...response,
    };
    
    
    if (response.data?.user) {
      transformedResponse.user = response.data.user;
      transformedResponse.token = response.data.accessToken || responseAny.data?.token || response.token;
      transformedResponse.refreshToken = response.data.refreshToken || response.refreshToken;
    } else if (response.user) {
      transformedResponse.user = response.user;
      transformedResponse.token = response.token || responseAny.accessToken;
      transformedResponse.refreshToken = response.refreshToken;
    } else if (responseAny.data) {
    
      const data = responseAny.data;
      if (data.id || data.email) {
        transformedResponse.user = data as User;
        transformedResponse.token = data.accessToken || data.token || response.token;
        transformedResponse.refreshToken = data.refreshToken || response.refreshToken;
      }
    }
    
    return transformedResponse;
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    return this.request<RefreshTokenResponse>('/api/v1/users/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async logout(token: string): Promise<{ message: string; statusCode: number; success: boolean }> {
    try {
      return await this.authenticatedRequest<{ message: string; statusCode: number; success: boolean }>(
        '/api/v1/users/logout',
        token,
        {
          method: 'POST',
        },
        false
      );
    } catch (error: any) {
      if (error?.message?.includes('Invalid access token') || 
          error?.message?.includes('Invalid token') ||
          error?.message?.includes('401') ||
          error?.message?.includes('endpoint not found') ||
          error?.message?.includes('HTML')) {
        return { message: 'Logged out successfully', statusCode: 200, success: true };
      }
      throw error;
    }
  }

  async getCurrentUser(token: string): Promise<User> {
    try {
      return await this.authenticatedRequest<User>('/api/v1/users/me', token, {}, false);
    } catch (error: any) {
      if (error?.message?.includes('HTML') || error?.message?.includes('endpoint not found')) {
        throw new Error('User endpoint not available');
      }
      if (error?.message?.includes('Invalid access token') || 
          error?.message?.includes('Invalid token') ||
          error?.message?.includes('401')) {
        throw new Error('Invalid access token');
      }
      throw error;
    }
  }

  async updateProfile(token: string, data: Partial<User>): Promise<User> {
    return this.authenticatedRequest<User>('/api/v1/users/profile', token, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateProfilePicture(token: string, imageUri: string): Promise<User> {
    const formData = new FormData();
    formData.append('profilePicture', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any);

    return this.authenticatedRequest<User>('/api/v1/users/profile/picture', token, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData as any,
    });
  }

  async getUserStatistics(token: string): Promise<{
    coursesEnrolled: number;
    progress: number;
  }> {
    try {
      return await this.authenticatedRequest<{ coursesEnrolled: number; progress: number }>(
        '/api/v1/users/statistics',
        token
      );
    } catch (error: any) {
      if (error.message?.includes('endpoint not found') || 
          error.message?.includes('HTML') || 
          error.message?.includes('API endpoint not found') ||
          error.message?.includes('Invalid access token') ||
          error.message?.includes('Invalid token') ||
          error.message?.includes('401')) {
        return { coursesEnrolled: 0, progress: 0 };
      }
    
      throw error;
    }
  }

  async getInstructors(page: number = 1, limit: number = 10): Promise<Instructor[]> {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      const response = await this.request<RandomUsersResponse>(`/api/v1/public/randomusers?${queryParams}`);
      
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        const dataObj = response.data as { data?: Instructor[] };
        if (Array.isArray(dataObj.data)) {
          return dataObj.data;
        }
      }
      
      if (Array.isArray(response)) {
        return response;
      }
      
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      if (response.results && Array.isArray(response.results)) {
        return response.results;
      }
      
      return [];
    } catch (error) {
      throw error;
    }
  }

  async getCourses(
    page: number = 1,
    limit: number = 10,
    inc?: string,
    query?: string
  ): Promise<Course[]> {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      
      if (inc) {
        queryParams.append('inc', inc);
      }
      if (query) {
        queryParams.append('query', query);
      }
      
      const response = await this.request<RandomProductsResponse>(`/api/v1/public/randomproducts?${queryParams}`);
      
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        const dataObj = response.data as { data?: Course[] };
        if (Array.isArray(dataObj.data)) {
        return dataObj.data.map(course => {
          const backendThumbnail = course.thumbnail;
          const convertedThumbnail = this.convertDummyJsonUrl(backendThumbnail);
          const convertedImages = (course.images || []).map(img => this.convertDummyJsonUrl(img)).filter(Boolean) as string[];
          
          return {
            ...course,
            thumbnail: convertedThumbnail || backendThumbnail,
            image: convertedThumbnail || backendThumbnail || course.image,
            images: convertedImages,
          };
        });
        }
      }
      
      if (Array.isArray(response)) {
        return response.map(course => {
          const backendThumbnail = course.thumbnail;
          const convertedThumbnail = this.convertDummyJsonUrl(backendThumbnail);
          const convertedImages = (course.images || []).map((img: string) => this.convertDummyJsonUrl(img)).filter(Boolean) as string[];
          return {
            ...course,
            thumbnail: convertedThumbnail || backendThumbnail,
            image: convertedThumbnail || backendThumbnail || course.image,
            images: convertedImages,
          };
        });
      }
      
      if (response.data && Array.isArray(response.data)) {
        return response.data.map(course => {
          const backendThumbnail = course.thumbnail;
          const convertedThumbnail = this.convertDummyJsonUrl(backendThumbnail);
          const convertedImages = (course.images || []).map((img: string) => this.convertDummyJsonUrl(img)).filter(Boolean) as string[];
          return {
            ...course,
            thumbnail: convertedThumbnail || backendThumbnail,
            image: convertedThumbnail || backendThumbnail || course.image,
            images: convertedImages,
          };
        });
      }
      
      if (response.products && Array.isArray(response.products)) {
        return response.products.map(course => {
          const convertedThumbnail = this.convertDummyJsonUrl(course.thumbnail);
          return {
            ...course,
            thumbnail: convertedThumbnail || course.thumbnail,
            image: convertedThumbnail || course.thumbnail || course.image,
            images: course.images || [],
          };
        });
      }
      
      return [];
    } catch (error) {
      throw error;
    }
  }
}

export const apiService = new ApiService(API_BASE_URL);
