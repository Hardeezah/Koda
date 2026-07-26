import { supabase } from './supabase';

export const authService = {
  async signUp(email: string, password: string, fullName?: string) {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    const response = await fetch(`${apiUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.detail || 'Registration failed');
    }
    return result;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
};
