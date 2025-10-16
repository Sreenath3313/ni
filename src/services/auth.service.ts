import api from './api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'staff';
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

const AuthService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    
    // Store token and user in localStorage
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  },
  
  register: async (data: RegisterData): Promise<{ user: User }> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },
  
  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data.user;
  },
  
  updateProfile: async (data: { email: string; full_name: string }): Promise<User> => {
    const response = await api.put('/auth/profile', data);
    
    // Update stored user data
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...response.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    return response.data.user;
  },
  
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    await api.put('/auth/change-password', data);
  },
  
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
  
  hasRole: (roles: string[]): boolean => {
    const user = AuthService.getCurrentUser();
    return user !== null && roles.includes(user.role);
  }
};

export default AuthService;