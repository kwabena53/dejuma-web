'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import Toast from '@/components/Toast'

interface ToastData {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void
  showSuccess: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  showWarning: (message: string, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', duration = 5000) => {
    const id = Date.now().toString()
    const newToast: ToastData = { id, message, type, duration }
    
    setToasts(prev => [...prev, newToast])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const showSuccess = (message: string, duration = 5000) => showToast(message, 'success', duration)
  const showError = (message: string, duration = 5000) => showToast(message, 'error', duration)
  const showWarning = (message: string, duration = 5000) => showToast(message, 'warning', duration)
  const showInfo = (message: string, duration = 5000) => showToast(message, 'info', duration)

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      
      {/* Render toasts */}
      <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 space-y-3 pointer-events-none">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className="pointer-events-auto animate-in slide-in-from-right-full"
            style={{
              animationDelay: `${index * 0.1}s`,
              animationDuration: '0.3s',
              animationFillMode: 'forwards'
            }}
          >
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}