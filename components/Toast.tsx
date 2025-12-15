'use client';

import { useEffect, useState } from 'react';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

let toastListeners: ((toast: Toast) => void)[] = [];

export function showToast(message: string, type: Toast['type'] = 'success', duration = 3000) {
    const toast: Toast = {
        id: Math.random().toString(36).substr(2, 9),
        message,
        type,
        duration,
    };

    toastListeners.forEach(listener => listener(toast));
}

export default function ToastContainer() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        const listener = (toast: Toast) => {
            setToasts(prev => [...prev, toast]);

            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== toast.id));
            }, toast.duration || 3000);
        };

        toastListeners.push(listener);

        return () => {
            toastListeners = toastListeners.filter(l => l !== listener);
        };
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`
            px-4 py-3 rounded-lg shadow-lg border animate-slide-in-right
            ${toast.type === 'success' ? 'bg-green-900/90 border-green-700 text-green-100' : ''}
            ${toast.type === 'error' ? 'bg-red-900/90 border-red-700 text-red-100' : ''}
            ${toast.type === 'info' ? 'bg-blue-900/90 border-blue-700 text-blue-100' : ''}
            ${toast.type === 'warning' ? 'bg-yellow-900/90 border-yellow-700 text-yellow-100' : ''}
          `}
                >
                    <div className="flex items-center gap-2">
                        {toast.type === 'success' && <span className="text-xl">✓</span>}
                        {toast.type === 'error' && <span className="text-xl">✕</span>}
                        {toast.type === 'info' && <span className="text-xl">ℹ</span>}
                        {toast.type === 'warning' && <span className="text-xl">⚠</span>}
                        <span className="text-sm font-medium">{toast.message}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
