import { supabase } from '@/lib/supabaseClient';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
  role?: 'admin' | 'manager' | 'staff';
}

export interface User {
  id: string; // Supabase auth user id (UUID)
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'staff';
}

export interface AuthResponse {
  token?: string; // Supabase session access token
  user: User;
}

const AuthService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) throw error;

    const authUser = data.user;
    if (!authUser) throw new Error('Login succeeded but user not returned');

    // Ensure a profile exists in public.users; create if missing (with default role)
    let { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id,email,role,first_name,last_name')
      .eq('id', authUser.id)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      // No profile found; attempt to create one (requires session)
      const insertRes = await supabase.from('users').insert({
        id: authUser.id,
        email: authUser.email ?? credentials.email,
        role: 'staff',
      });
      if (insertRes.error) throw insertRes.error;
      const { data: created, error: createdErr } = await supabase
        .from('users')
        .select('id,email,role,first_name,last_name')
        .eq('id', authUser.id)
        .single();
      if (createdErr) throw createdErr;
      profile = created;
    } else if (profileError) {
      throw profileError;
    }

    const user: User = {
      id: authUser.id,
      email: profile?.email ?? authUser.email ?? credentials.email,
      full_name:
        (profile?.first_name && profile?.last_name)
          ? `${profile.first_name} ${profile.last_name}`
          : profile?.first_name || profile?.last_name || (authUser.email ?? credentials.email),
      role: (profile?.role as any) ?? 'staff',
    };

    return { token: data.session?.access_token, user };
  },
  
  register: async (data: RegisterData): Promise<{ user: User }> => {
    const { email, password, full_name, role } = data;
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;

    const authUser = signUpData.user;
    if (!authUser) {
      // Email confirmation may be required; return a shallow user object
      return {
        user: {
          id: 'pending',
          email,
          full_name: full_name ?? email,
          role: (role as any) ?? 'staff',
        },
      };
    }

    // If session exists, create a profile; otherwise it will be created on first login
    if (signUpData.session) {
      const { error: insertErr } = await supabase.from('users').insert({
        id: authUser.id,
        email,
        role: (role as any) ?? 'staff',
      });
      if (insertErr) throw insertErr;
    }

    return {
      user: {
        id: authUser.id,
        email,
        full_name: full_name ?? email,
        role: (role as any) ?? 'staff',
      },
    };
  },
  
  logout: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  
  getCurrentUser: async (): Promise<User | null> => {
    const { data } = await supabase.auth.getUser();
    const authUser = data.user;
    if (!authUser) return null;

    const { data: profile, error } = await supabase
      .from('users')
      .select('id,email,role,first_name,last_name')
      .eq('id', authUser.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return {
      id: authUser.id,
      email: profile?.email ?? authUser.email ?? '',
      full_name:
        (profile?.first_name && profile?.last_name)
          ? `${profile.first_name} ${profile.last_name}`
          : profile?.first_name || profile?.last_name || (authUser.email ?? ''),
      role: (profile?.role as any) ?? 'staff',
    };
  },
  
  getProfile: async (): Promise<User> => {
    const { data } = await supabase.auth.getUser();
    const authUser = data.user;
    if (!authUser) throw new Error('Not authenticated');

    const { data: profile, error } = await supabase
      .from('users')
      .select('id,email,role,first_name,last_name')
      .eq('id', authUser.id)
      .single();
    if (error) throw error;
    return {
      id: authUser.id,
      email: profile.email,
      full_name:
        (profile.first_name && profile.last_name)
          ? `${profile.first_name} ${profile.last_name}`
          : profile.first_name || profile.last_name || (authUser.email ?? ''),
      role: profile.role as any,
    };
  },
  
  updateProfile: async (data: { email?: string; full_name?: string }): Promise<User> => {
    const { data: auth } = await supabase.auth.getUser();
    const authUser = auth.user;
    if (!authUser) throw new Error('Not authenticated');

    const [first_name, ...lastParts] = (data.full_name ?? '').split(' ');
    const last_name = lastParts.join(' ').trim();

    const updates: any = {};
    if (data.email) updates.email = data.email;
    if (data.full_name) {
      updates.first_name = first_name || null;
      updates.last_name = last_name || null;
    }

    const { data: updated, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', authUser.id)
      .select('id,email,role,first_name,last_name')
      .single();
    if (error) throw error;

    return {
      id: authUser.id,
      email: updated.email,
      full_name:
        (updated.first_name && updated.last_name)
          ? `${updated.first_name} ${updated.last_name}`
          : updated.first_name || updated.last_name || (authUser.email ?? ''),
      role: updated.role as any,
    };
  },
  
  changePassword: async (data: { currentPassword?: string; newPassword: string }): Promise<void> => {
    const { error } = await supabase.auth.updateUser({ password: data.newPassword });
    if (error) throw error;
  },
  
  isAuthenticated: async (): Promise<boolean> => {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  },
  
  hasRole: async (roles: ('admin' | 'manager' | 'staff')[]): Promise<boolean> => {
    const user = await AuthService.getCurrentUser();
    return user !== null && roles.includes(user.role);
  }
};

export default AuthService;