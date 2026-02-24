/**
 * Error Handler Utility
 * Provides user-friendly error messages and error categorization
 */

export interface AppError {
  message: string;
  type: 'network' | 'timeout' | 'server' | 'client' | 'unknown';
  retryable: boolean;
  originalError?: any;
}

export class ErrorHandler {
  /**
   * Convert error to user-friendly message
   */
  static getUserFriendlyMessage(error: any): string {
    const errorMessage = error?.message || String(error) || 'An unexpected error occurred';

    if (
      errorMessage.includes('Network request failed') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('Network error') ||
      errorMessage.includes('No internet connection')
    ) {
      return 'No internet connection. Please check your network settings and try again.';
    }

    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      return 'Request timed out. Please check your connection and try again.';
    }

    if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
      return 'Server error. Please try again later.';
    }

    if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
      return 'The requested resource was not found.';
    }

    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      return 'Your session has expired. Please log in again.';
    }

    if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      return 'You do not have permission to access this resource.';
    }

    if (errorMessage.includes('API URL not configured')) {
      return 'Application configuration error. Please contact support.';
    }

    if (errorMessage.length < 100 && !errorMessage.includes('Error:') && !errorMessage.includes('TypeError')) {
      return errorMessage;
    }

    
    return 'Something went wrong. Please try again.';
  }

  /**
   * Categorize error type
   */
  static categorizeError(error: any): AppError {
    const errorMessage = error?.message || String(error) || 'Unknown error';
    let type: AppError['type'] = 'unknown';
    let retryable = false;

    if (
      errorMessage.includes('Network') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('No internet')
    ) {
      type = 'network';
      retryable = true;
    } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      type = 'timeout';
      retryable = true;
    } else if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
      type = 'server';
      retryable = true;
    } else if (errorMessage.includes('400') || errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('404')) {
      type = 'client';
      retryable = false;
    }

    return {
      message: this.getUserFriendlyMessage(error),
      type,
      retryable,
      originalError: error,
    };
  }

  
  static isRetryable(error: any): boolean {
    const categorized = this.categorizeError(error);
    return categorized.retryable;
  }
}


export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  maxDelay: number = 10000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

   
      if (attempt === maxRetries || !ErrorHandler.isRetryable(error)) {
        throw error;
      }

      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      console.log(`⏳ Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 10000,
  timeoutMessage: string = 'Request timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ]);
}
