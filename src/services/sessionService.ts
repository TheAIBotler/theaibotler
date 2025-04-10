// services/sessionService.ts
import { v4 as uuidv4 } from 'uuid'
import { SessionLogger } from '@/app/utils/sessionLogger'

const SESSION_ID_KEY = 'commenter_session_id'
const SESSION_EXPIRY_KEY = 'commenter_session_expiry'
const SESSION_NAME_KEY = 'commenter_name'

export class SessionService {
  private static instance: SessionService
  private sessionId: string | null = null
  private userId: string | null = null
  private userName: string | null = null
  private isInitialized = false

  private constructor() {
    // Will initialize on first getSessionId call
  }

  public static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService()
    }
    return SessionService.instance
  }

  /**
   * Initializes the session - called internally by getSessionId
   */
  private initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') return
    
    try {
      // Get session ID and check if it's expired
      let sessionId = localStorage.getItem(SESSION_ID_KEY)
      const expiryStr = localStorage.getItem(SESSION_EXPIRY_KEY)
      const now = Date.now()
      
      // Check if session exists and hasn't expired
      if (sessionId && expiryStr && parseInt(expiryStr) > now) {
        this.sessionId = sessionId
        // Extend expiration with each use
        const newExpiry = now + (30 * 24 * 60 * 60 * 1000) // 30 days
        localStorage.setItem(SESSION_EXPIRY_KEY, newExpiry.toString())
      } else {
        // Create new session if none exists or expired
        sessionId = uuidv4()
        const expiry = now + (30 * 24 * 60 * 60 * 1000) // 30 days
        localStorage.setItem(SESSION_ID_KEY, sessionId)
        localStorage.setItem(SESSION_EXPIRY_KEY, expiry.toString())
        this.sessionId = sessionId
        
        SessionLogger.info('session', 'Created new session ID with 30-day expiry', { 
          sessionId: sessionId.substring(0, 8) + '...' 
        })
      }
      
      // Get commenter name if set
      this.userName = localStorage.getItem(SESSION_NAME_KEY)
      
      this.isInitialized = true
    } catch (error) {
      SessionLogger.error('session', 'Error initializing session', { error })
      // Use a temporary session ID
      this.sessionId = 'temp-' + uuidv4()
    }
  }

  /**
   * Resets the service state (useful for recovery)
   */
  public reset(): void {
    this.isInitialized = false;
    this.userId = null;
    // Don't reset sessionId yet - it will be recreated on next getSessionId() call
    SessionLogger.info('session', 'SessionService reset');
  }

  /**
   * Gets the current session ID for anonymous users
   */
  public getSessionId(): string {
    if (!this.isInitialized) {
      this.initialize()
    }
    return this.sessionId || 'server-side-session'
  }

  /**
   * Updates the user name for the session
   */
  public setUserName(name: string): void {
    this.userName = name
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_NAME_KEY, name)
    }
  }

  /**
   * Gets the current user name if available
   */
  public getUserName(): string | null {
    if (!this.isInitialized) {
      this.initialize()
    }
    return this.userName
  }

  /**
   * Sets the user ID when authenticated
   */
  public setUserId(userId: string | null): void {
    const wasAuthenticated = !!this.userId;
    const isBecomingAuthenticated = !wasAuthenticated && !!userId;
    const isBecomingAnonymous = wasAuthenticated && !userId;
    
    // Update user ID
    this.userId = userId;
    
    // Log transition for debugging
    if (isBecomingAuthenticated) {
      SessionLogger.info('session', 'Transitioning from anonymous to authenticated', {
        newUserId: userId?.substring(0, 8) + '...'
      });
    } else if (isBecomingAnonymous) {
      SessionLogger.info('session', 'Transitioning from authenticated to anonymous');
    }
    
    // If transitioning from authenticated to anonymous, reset session
    if (isBecomingAnonymous) {
      this.isInitialized = false; // Force reinitialization on next getSessionId()
      SessionLogger.info('session', 'Reset session state due to sign out');
    }
    
    // If transitioning from anonymous to authenticated, ensure proper state
    if (isBecomingAuthenticated) {
      // Clear any lingering anonymous session data that might conflict
      this.sessionId = null;
      SessionLogger.info('session', 'Cleared anonymous session data for authenticated user');
    }
  }

  /**
   * Gets the current user ID if authenticated
   */
  public getUserId(): string | null {
    return this.userId
  }

  /**
   * Checks if the user is currently authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.userId
  }

  /**
   * Checks if the current user can modify the given comment
   */
  public canModifyComment(comment: Record<string, unknown>, isAuthor: boolean): boolean {
    // Admin (author) can modify all comments
    if (isAuthor) {
      SessionLogger.debug('comment', 'Admin can modify comment', { 
        commentId: comment.id,
        isAuthor
      });
      return true;
    }
    
    // If authenticated but not admin, shouldn't happen in current system
    if (this.isAuthenticated() && !isAuthor) {
      SessionLogger.debug('comment', 'Authenticated non-admin user cannot modify comment', { 
        commentId: comment.id,
        isAuthenticated: this.isAuthenticated(),
        isAuthor
      });
      return false;
    }
    
    // Anonymous users can only modify their own comments
    const currentSessionId = this.getSessionId();
    
    // Log the raw values without truncation for debugging
    SessionLogger.debug('comment', 'Raw session comparison for debugging', {
      currentSessionId: currentSessionId,
      commentSessionId: comment.session_id,
      isMatch: comment.session_id === currentSessionId,
      commentId: comment.id,
      commentSessionIdType: typeof comment.session_id,
      currentSessionIdType: typeof currentSessionId
    });
    
    // Direct comparison as done in CommentThread.tsx
    // This matches how the UI determines ownership
    return comment.session_id === currentSessionId;
  }

  /**
   * Creates a new anonymous session (used after logout)
   */
  public createNewSession(): void {
    if (typeof window === 'undefined') return
    
    this.userId = null
    this.sessionId = uuidv4()
    const expiry = Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    
    try {
      localStorage.setItem(SESSION_ID_KEY, this.sessionId)
      localStorage.setItem(SESSION_EXPIRY_KEY, expiry.toString())
      
      SessionLogger.info('session', 'Created new session after logout', {
        sessionId: this.sessionId.substring(0, 8) + '...'
      })
    } catch (error) {
      SessionLogger.error('session', 'Error creating new session', { error })
    }
  }
}

// Convenience function to get the session ID (legacy support)
export const getSessionId = (): string => {
  return SessionService.getInstance().getSessionId()
}
