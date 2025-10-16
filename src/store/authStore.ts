import { create } from 'zustand';
import AuthService, { User } from '../services/auth.service';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  role: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (data: { email: string; full_name: string }) => Promise<void>;
  register: (username: string, password: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  role: null,
  login: async (username: string, password: string) => {
    try {
      const response = await AuthService.login({ username, password });
      
      set({
        isAuthenticated: true,
        user: response.user,
        role: response.user.role,
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  logout: async () => {
    AuthService.logout();
    set({ isAuthenticated: false, user: null, role: null });
  },
  checkAuth: async () => {
    try {
      const user = AuthService.getCurrentUser();
      
      if (user) {
        set({
          isAuthenticated: true,
          user,
          role: user.role,
        });
      } else {
        set({ isAuthenticated: false, user: null, role: null });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      set({ isAuthenticated: false, user: null, role: null });
    }
  },
  updateProfile: async (data: { email: string; full_name: string }) => {
    try {
      const updatedUser = await AuthService.updateProfile(data);
      set((state) => ({
        ...state,
        user: updatedUser,
      }));
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  },
  register: async (username: string, password: string) => {
    try {
      await AuthService.register(username, password);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
}));
