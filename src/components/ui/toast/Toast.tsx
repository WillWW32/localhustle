'use client'

import { useState, useEffect } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
}

export function Toast({ message, type = 'info', duration = 4000 }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration)
    return () => clearTimeout(timer)
  }, [duration])

  if (!visible) return null

  const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-black'
  const textColor = 'text-white'

  return (
    <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 ${bgColor} ${textColor} px-8 py-6 rounded-lg shadow-2xl z-50 animate-fadeIn`}>
      <p className="text-xl font-mono">{message}</p>
    </div>
  )
}

// Global toast manager (add to layout or dashboard)
export function useToast() {
  const [toasts, setToasts] = useState<{ id: number; message: string; type: ToastType }[]>([])

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now()
    setToasts([...toasts, { id, message, type }])

    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id))
    }, 4000)
  }

  const ToastContainer = () => (
    <>
      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} type={toast.type} />
      ))}
    </>
  )

  return { addToast, ToastContainer }
}