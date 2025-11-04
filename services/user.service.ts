import { supabase } from '@/lib/supabase';

export interface User {
  id: string;
  email: string | undefined;
  role: string | null;
  createdAt: string;
}

export const getUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('users').select('id, email, role, created_at');

  if (error) {
    throw new Error(error.message);
  }

  return data.map((user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.created_at,
  }));
};

export const getUserById = async (id: string): Promise<User | null> => {
  const { data, error } = await supabase.from('users').select('id, email, role, created_at').eq('id', id).single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    role: data.role,
    createdAt: data.created_at,
  };
};
