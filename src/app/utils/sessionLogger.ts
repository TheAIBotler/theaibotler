// app/utils/sessionLogger.ts

// Define log levels and colors for console output
const LOG_LEVELS = {
  debug: { emoji: '🔍', color: '#7986CB' }, // Light blue
  info: { emoji: 'ℹ️', color: '#4CAF50' },  // Green
  warn: { emoji: '⚠️', color: '#FF9800' },  // Orange
  error: { emoji: '❌', color: '#F44336' }  // Red
};

// Define categories for different types of logs
const LOG_CATEGORIES = {
  session: '🔑',
  auth: '👤',
  comment: '💬',
  network: '🌐',
  error: '💥'
};

// Type definitions
type LogLevel = keyof typeof LOG_LEVELS;
type LogCategory = keyof typeof LOG_CATEGORIES;

interface LogEntry {
  timestamp: number;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
}

// Storage configuration
const MAX_LOGS = 100;
const STORAGE_KEY = 'session_debug_logs';

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development';

// Session Logger class
export class SessionLogger {
  private static logs: LogEntry[] = [];
  private static enabled = true;
  
  // Enable or disable logging
  static setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`Session logging ${enabled ? 'enabled' : 'disabled'}`);
    
    // Save preference to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('session_logging_enabled', String(enabled));
    }
  }
  
  // Initialize logger on startup
  static init(): void {
    if (typeof window !== 'undefined') {
      // Load logs from storage
      try {
        const storedLogs = localStorage.getItem(STORAGE_KEY);
        if (storedLogs) {
          this.logs = JSON.parse(storedLogs);
        }
      } catch (e) {
        console.warn('Failed to load session logs from storage');
      }
      
      // Load enabled status from storage
      const enabled = localStorage.getItem('session_logging_enabled');
      if (enabled !== null) {
        this.enabled = enabled === 'true';
      }
      
      // Log initialization
      this.info('session', 'Session logger initialized', { logsLoaded: this.logs.length });
      
      // Add beforeunload event to save logs
      window.addEventListener('beforeunload', () => {
        this.saveLogs();
      });
      
      // Install global error handler to catch 406 errors
      this.installGlobalErrorHandler();
    }
  }
  
  // Save logs to localStorage
  private static saveLogs(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs.slice(-MAX_LOGS)));
      } catch (e) {
        console.warn('Failed to save session logs to storage');
      }
    }
  }
  
  // Get all logs
  static getLogs(): LogEntry[] {
    return [...this.logs];
  }
  
  // Clear all logs
  static clearLogs(): void {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.info('session', 'Logs cleared');
  }
  
  // Download logs as JSON file
  static downloadLogs(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const dateStr = new Date().toISOString().replace(/:/g, '-');
      const filename = `session-logs-${dateStr}.json`;
      
      const logData = JSON.stringify(this.logs, null, 2);
      const blob = new Blob([logData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.info('session', 'Logs downloaded', { filename });
    } catch (e) {
      console.error('Failed to download logs:', e);
    }
  }
  
  // General logging function
  private static log(level: LogLevel, category: LogCategory, message: string, data?: any): void {
    if (!this.enabled && level === 'debug') return;
    
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data: data ? { ...data } : undefined
    };
    
    // Add to memory logs
    this.logs.push(entry);
    
    // Trim logs if needed
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(-MAX_LOGS);
    }
    
    // Format for console
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const logInfo = LOG_LEVELS[level];
    const categoryEmoji = LOG_CATEGORIES[category];
    
    // Only show in console if enabled or if it's an important log
    if (this.enabled || level !== 'debug') {
      // Create styled console output
      const style = `color: ${logInfo.color}; font-weight: bold;`;
      const prefix = `%c${logInfo.emoji} ${categoryEmoji} [${timestamp}]`;
      
      // Log to console with appropriate level
      switch (level) {
        case 'debug':
          console.debug(prefix, style, message, data || '');
          break;
        case 'info':
          console.info(prefix, style, message, data || '');
          break;
        case 'warn':
          console.warn(prefix, style, message, data || '');
          break;
        case 'error':
          console.error(prefix, style, message, data || '');
          break;
      }
    }
    
    // Save logs periodically (not on every log to avoid performance issues)
    if (this.logs.length % 10 === 0) {
      this.saveLogs();
    }
  }
  
  // Specific logging methods
  static debug(category: LogCategory, message: string, data?: any): void {
    this.log('debug', category, message, data);
  }
  
  static info(category: LogCategory, message: string, data?: any): void {
    this.log('info', category, message, data);
  }
  
  static warn(category: LogCategory, message: string, data?: any): void {
    this.log('warn', category, message, data);
  }
  
  static error(category: LogCategory, message: string, data?: any): void {
    this.log('error', category, message, data);
  }
  
  // Special method for tracking 406 errors
  static track406Error(source: string, error: any, context?: any): void {
    this.error('error', `406 Error in ${source}`, {
      source,
      errorCode: error?.code || 'unknown',
      errorMessage: error?.message || String(error),
      errorData: error,
      context
    });
    
    // Also push to a special array just for 406 errors
    if (typeof window !== 'undefined') {
      try {
        const errors406 = JSON.parse(localStorage.getItem('session_406_errors') || '[]');
        errors406.push({
          timestamp: Date.now(),
          source,
          errorCode: error?.code || 'unknown',
          errorMessage: error?.message || String(error),
          url: window.location.href,
          context
        });
        
        // Keep only the latest 20 errors
        if (errors406.length > 20) {
          errors406.shift();
        }
        
        localStorage.setItem('session_406_errors', JSON.stringify(errors406));
      } catch (e) {
        // Ignore storage errors
      }
    }
  }
  
  // Install global error handler for 406 errors
  private static installGlobalErrorHandler(): void {
    if (typeof window === 'undefined' || !window.console) return;
    
    const originalConsoleError = console.error;
    
    console.error = function(...args) {
      // Check if this is a 406 error related to session context
      const errorString = args.map(arg => String(arg)).join(' ');
      if (errorString.includes('406') && 
          (errorString.includes('set_session_context') || 
           errorString.includes('permission denied'))) {
        
        // Track this 406 error
        SessionLogger.track406Error('console.error', { 
          message: errorString 
        }, { args });
        
        // Continue to show in console during development
        if (isDev) {
          args[0] = '%c⚠️ [INTERCEPTED 406 ERROR]';
          originalConsoleError.apply(console, [args[0], 'color: orange; font-weight: bold', ...args.slice(1)]);
        }
        
        // Trigger automatic recovery if not already in progress
        if (typeof window.__recoveringSession === 'undefined' || !window.__recoveringSession) {
          window.__recoveringSession = true;
          SessionLogger.warn('session', 'Attempting automatic 406 error recovery');
          
          // Import dynamically to avoid circular dependencies
          import('../utils/supabase/client').then(({ recoverFromSessionError }) => {
            recoverFromSessionError().then(success => {
              SessionLogger.info('session', `Automatic recovery ${success ? 'succeeded' : 'failed'}`);
              window.__recoveringSession = false;
            });
          });
        }
        
        return;
      }
      
      // Pass through all other errors to original handler
      originalConsoleError.apply(console, args);
    };
  }
  
  // Track session context operations
  static trackSessionContext(operation: string, user: any | null, success: boolean, duration: number, error?: any): void {
    const level = success ? 'info' : 'error';
    const message = `Session context ${operation} ${success ? 'succeeded' : 'failed'}`;
    
    this.log(level, 'session', message, {
      operation,
      isAuthenticated: !!user?.id,
      userEmail: user?.email,
      duration,
      error
    });
  }
  
  // Track tab visibility changes
  static trackTabVisibility(visible: boolean): void {
    this.info('session', `Tab ${visible ? 'became visible' : 'hidden'}`, {
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      timestamp: new Date().toISOString()
    });
  }
}

// Initialize on import if in browser
if (typeof window !== 'undefined') {
  SessionLogger.init();
  
  // Add recoveringSession to Window interface
  declare global {
    interface Window {
      __recoveringSession?: boolean;
    }
  }
}