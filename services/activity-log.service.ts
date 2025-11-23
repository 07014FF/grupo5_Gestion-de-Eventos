/**
 * Servicio de Activity Log
 * Registra todas las acciones importantes del sistema para auditoría
 */

import { supabase } from '@/lib/supabase';

export type ActivityAction =
  | 'role_change'
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'payment_completed'
  | 'payment_mock'
  | 'payment_manual'
  | 'payment_failed'
  | 'ticket_validated'
  | 'ticket_created'
  | 'event_created'
  | 'event_updated'
  | 'event_deleted'
  | 'login'
  | 'logout'
  | 'permission_changed';

export type EntityType =
  | 'user'
  | 'payment'
  | 'ticket'
  | 'event'
  | 'purchase'
  | 'validation'
  | 'system';

export interface ActivityLogEntry {
  id?: string;
  user_id?: string | null;
  user_email?: string;
  user_name?: string;
  action: ActivityAction;
  entity_type?: EntityType;
  entity_id?: string;
  description: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

export interface CreateActivityLogParams {
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: ActivityAction;
  entityType?: EntityType;
  entityId?: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class ActivityLogService {
  /**
   * Registrar una acción en el log
   */
  static async log(params: CreateActivityLogParams): Promise<void> {
    try {
      const { error } = await supabase.from('activity_log').insert({
        user_id: params.userId || null,
        user_email: params.userEmail,
        user_name: params.userName,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        description: params.description,
        metadata: params.metadata || {},
        ip_address: params.ipAddress,
        user_agent: params.userAgent,
      });

      if (error) {
        console.error('❌ Error logging activity:', error);
      }
    } catch (error) {
      console.error('❌ Exception logging activity:', error);
    }
  }

  /**
   * Obtener logs recientes de un usuario
   */
  static async getUserLogs(
    userId: string,
    limit: number = 10
  ): Promise<ActivityLogEntry[]> {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching user logs:', error);
      return [];
    }
  }

  /**
   * Obtener logs recientes de una entidad
   */
  static async getEntityLogs(
    entityType: EntityType,
    entityId: string,
    limit: number = 10
  ): Promise<ActivityLogEntry[]> {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching entity logs:', error);
      return [];
    }
  }

  /**
   * Obtener todos los logs recientes (solo para admins)
   */
  static async getRecentLogs(limit: number = 50): Promise<ActivityLogEntry[]> {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching recent logs:', error);
      return [];
    }
  }

  /**
   * Obtener logs por tipo de acción
   */
  static async getLogsByAction(
    action: ActivityAction,
    limit: number = 50
  ): Promise<ActivityLogEntry[]> {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('action', action)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching logs by action:', error);
      return [];
    }
  }

  /**
   * Obtener estadísticas de actividad
   */
  static async getActivityStats(days: number = 7): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    topUsers: Array<{ user_email: string; count: number }>;
  }> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data, error } = await supabase
        .from('activity_log')
        .select('action, user_email')
        .gte('created_at', since.toISOString());

      if (error) throw error;

      const logs = data || [];
      const actionsByType: Record<string, number> = {};
      const userCounts: Record<string, number> = {};

      logs.forEach((log) => {
        actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
        if (log.user_email) {
          userCounts[log.user_email] = (userCounts[log.user_email] || 0) + 1;
        }
      });

      const topUsers = Object.entries(userCounts)
        .map(([user_email, count]) => ({ user_email, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalActions: logs.length,
        actionsByType,
        topUsers,
      };
    } catch (error) {
      console.error('❌ Error fetching activity stats:', error);
      return {
        totalActions: 0,
        actionsByType: {},
        topUsers: [],
      };
    }
  }
}
