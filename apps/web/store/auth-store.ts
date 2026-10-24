import { create } from 'zustand';
import { UserDTO, UserRole } from '@eventra/shared';
import { api } from '../lib/api';

interface AuthState {
  user: UserDTO | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: UserDTO | null) => void;
  fetchMe: () => Promise<UserDTO | null>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  fetchMe: async () => {
    try {
      set({ isLoading: true });
      const res = await api.get<{ data: { user: UserDTO } }>('/auth/me');
      const user = res.data.user;
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return null;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout errors
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
