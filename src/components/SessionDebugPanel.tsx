// components/SessionDebugPanel.tsx
'use client'

import { useState, useEffect } from 'react'
import { SessionLogger } from '@/app/utils/sessionLogger'
import { SessionService } from '@/services/sessionService'

// Types for the logs and errors
interface LogEntry {
  timestamp: number;
  level: string;
  category: string;
  message: string;
  data?: Record<string, unknown>;
}

interface Error406Entry {
  timestamp: number;
  source: string;
  errorCode: string;
  errorMessage: string;
  url?: string;
  context?: Record<string, unknown>;
}

export default function SessionDebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [errors406, setErrors406] = useState<Error406Entry[]>([])
  const [isRecovering, setIsRecovering] = useState(false)
  
  // Only show in development
  const isDev = process.env.NODE_ENV === 'development'
  
  useEffect(() => {
    if (!isDev || typeof window === 'undefined') return
    
    const refreshLogs = () => {
      setLogs(SessionLogger.getLogs());
      
      try {
        const errors = JSON.parse(localStorage.getItem('session_406_errors') || '[]');
        setErrors406(errors);
      } catch {
        // Ignore
      }
    };
    
    refreshLogs();
    
    // Refresh logs every 2 seconds
    const interval = setInterval(refreshLogs, 2000);
    
    return () => {
      clearInterval(interval);
    };
  }, [isDev]);
  
  if (!isDev) return null
  
  const handleRecovery = async () => {
    setIsRecovering(true);
    try {
      // Create a new session ID
      SessionService.getInstance().createNewSession();
      alert('Session reset successful');
    } finally {
      setIsRecovering(false);
    }
  };
  
  const filteredLogs = logs.filter(log => 
    log.level === 'error' || 
    log.level === 'warn' || 
    (log.category === 'session' && log.level === 'info')
  ).slice(-20).reverse();
  
  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 bg-gray-800 text-white p-2 rounded-lg shadow-lg z-50 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Session Debug"
      >
        🐞
      </button>
      
      {/* Debug panel */}
      {isOpen && (
        <div className="fixed bottom-16 left-4 w-96 max-w-[calc(100vw-2rem)] max-h-[70vh] bg-gray-900 text-white rounded-lg shadow-lg z-50 flex flex-col">
          <div className="p-3 border-b border-gray-700 flex justify-between items-center">
            <h3>Session Debug Panel</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="p-3 border-b border-gray-700 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => SessionLogger.clearLogs()}
                className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 rounded"
              >
                Clear Logs
              </button>
              
              <button
                onClick={handleRecovery}
                disabled={isRecovering}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
              >
                {isRecovering ? 'Resetting...' : 'Reset Session'}
              </button>
              
              <button
                onClick={() => SessionLogger.downloadLogs()}
                className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 rounded"
              >
                Download Logs
              </button>
            </div>
          </div>
          
          <div className="p-3 overflow-y-auto flex-1">
            <h4 className="text-sm font-medium mb-2">406 Errors ({errors406.length})</h4>
            
            {errors406.length === 0 ? (
              <p className="text-xs text-gray-400">No 406 errors recorded</p>
            ) : (
              <div className="space-y-2 mb-4">
                {errors406.map((error, i) => (
                  <div key={i} className="text-xs bg-red-900/30 p-2 rounded">
                    <div className="text-gray-400 mb-1">
                      {new Date(error.timestamp).toLocaleTimeString()} · {error.source || 'Unknown'}
                    </div>
                    <div className="font-mono whitespace-pre-wrap text-red-400">
                      {error.errorCode}: {error.errorMessage}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <h4 className="text-sm font-medium mb-2">Recent Session Logs</h4>
            <div className="space-y-2">
              {filteredLogs.map((log, i) => (
                <div 
                  key={i} 
                  className={`text-xs p-2 rounded ${
                    log.level === 'error' 
                      ? 'bg-red-900/30' 
                      : log.level === 'warn' 
                        ? 'bg-yellow-900/30'
                        : 'bg-blue-900/30'
                  }`}
                >
                  <div className="text-gray-400 mb-1">
                    {new Date(log.timestamp).toLocaleTimeString()} · 
                    {log.level.toUpperCase()} · {log.category}
                  </div>
                  <div className="font-mono whitespace-pre-wrap">
                    {log.message}
                  </div>
                  {log.data && (
                    <details className="mt-1">
                      <summary className="text-gray-400 cursor-pointer">Details</summary>
                      <pre className="text-xs mt-1 overflow-x-auto text-gray-300">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}