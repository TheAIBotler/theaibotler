// app/utils/supabase/timeoutPlugin.ts

/**
 * Creates a Supabase query with timeout capability.
 * This can be used for any Supabase query that might hang.
 * 
 * @param queryFn Function that performs the Supabase query
 * @param timeoutMs Timeout in milliseconds
 * @returns Promise with the query result or a timeout error
 */
export function withTimeout<T>(
    queryFn: () => Promise<T>, 
    timeoutMs: number = 5000
  ): Promise<T> {
    // Create the main query promise
    const queryPromise = queryFn();
    
    // Create a timeout promise
    const timeoutPromise = new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Supabase operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
    
    // Race the two promises
    return Promise.race([queryPromise, timeoutPromise]);
  }
  
  /**
   * Helper to determine if an error is likely a network or timeout issue
   * 
   * @param error The error to check
   * @returns boolean indicating if this is a temporary network error
   */
  export function isNetworkOrTimeoutError(error: Error | unknown): boolean {
    if (!error) return false;
    
    // Check if error is an Error object with a message
    const errorObj = error as { message?: string; code?: string };
    
    // Check error message for common network-related keywords
    const errorMessage = errorObj.message?.toLowerCase() || '';
    const isNetworkRelated = 
      errorMessage.includes('network') || 
      errorMessage.includes('timeout') || 
      errorMessage.includes('connection') ||
      errorMessage.includes('offline') ||
      errorObj.code === 'ECONNABORTED' ||
      errorObj.code === 'ETIMEDOUT';
      
    return isNetworkRelated;
  }
  
  /**
   * Example usage in your code:
   * 
   * // Regular query
   * const { data, error } = await supabase.from('comments').select('*');
   * 
   * // With timeout plugin
   * try {
   *   const { data, error } = await withTimeout(
   *     () => supabase.from('comments').select('*'),
   *     3000 // 3 second timeout
   *   );
   *   
   *   // Handle result normally
   * } catch (error) {
   *   if (error.message.includes('timed out')) {
   *     // Handle timeout specifically
   *   } else {
   *     // Handle other errors
   *   }
   * }
   */