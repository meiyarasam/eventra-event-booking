import { create } from 'zustand';

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

// FIX BUG-013: Track auto-dismiss timer IDs so they can be cancelled when
// removeToast() is called manually before the timeout fires.
const toastTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    // Auto dismiss after 4 seconds; store the timer so it can be cancelled.
    const timer = setTimeout(() => {
      toastTimers.delete(id);
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
    toastTimers.set(id, timer);
  },
  removeToast: (id) => {
    // Cancel the pending timer if the user dismisses the toast manually.
    const timer = toastTimers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      toastTimers.delete(id);
    }
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

export const toast = {
  success: (message: string, title?: string) =>
    useToastStore.getState().addToast({ message, title, type: 'success' }),
  error: (message: string, title?: string) =>
    useToastStore.getState().addToast({ message, title, type: 'error' }),
  info: (message: string, title?: string) =>
    useToastStore.getState().addToast({ message, title, type: 'info' }),
  warning: (message: string, title?: string) =>
    useToastStore.getState().addToast({ message, title, type: 'warning' }),
};
