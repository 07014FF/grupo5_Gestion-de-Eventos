import { supabase } from '@/lib/supabase';
import { ActivityLogService } from '@/services/activity-log.service';

export type UserRole = 'client' | 'admin' | 'super_admin' | 'qr_validator';

export interface User {
  id: string;
  email?: string | null;
  role: UserRole | null;
  createdAt: string;
}

const USER_SELECT = 'id, email, role, created_at';

type UserRow = {
  id: string;
  email: string | null;
  role: UserRole | null;
  created_at: string;
};

const mapUser = (user: UserRow): User => ({
  id: user.id,
  email: user.email,
  role: user.role,
  createdAt: user.created_at,
});

export const getUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('users').select(USER_SELECT);

  if (error) {
    throw new Error(error.message);
  }

  return (data as UserRow[]).map(mapUser);
};

export const getUserById = async (id: string): Promise<User | null> => {
  const { data, error } = await supabase.from('users').select(USER_SELECT).eq('id', id).single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapUser(data as UserRow);
};

interface UpdateUserRoleOptions {
  performedBy?: string;
  previousRole?: UserRole | null;
  context?: string;
  actorEmail?: string | null;
}

export const updateUserRole = async (
  id: string,
  role: UserRole,
  options: UpdateUserRoleOptions = {}
): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', id)
    .select(USER_SELECT);

  if (error) {
    throw new Error(error.message);
  }

  const updatedRow = Array.isArray(data) ? (data[0] as UserRow | undefined) : (data as UserRow | undefined);

  if (!updatedRow) {
    throw new Error('No se pudo actualizar el rol del usuario.');
  }

  const updatedUser = mapUser(updatedRow);

  if (options.performedBy) {
    try {
      await ActivityLogService.log({
        userId: options.performedBy,
        userEmail: options.actorEmail || undefined,
        action: 'role_change',
        entityType: 'user',
        entityId: id,
        description: `Rol cambiado de ${options.previousRole || 'ninguno'} a ${role}`,
        metadata: {
          previousRole: options.previousRole ?? updatedUser.role,
          newRole: role,
          context: options.context ?? 'manual',
          targetEmail: updatedUser.email,
        },
      });
    } catch (logError) {
      console.error('⚠️ Failed to log admin action:', logError);
    }
  }

  return updatedUser;
};
