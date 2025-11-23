/**
 * Admin Service - Gestión de usuarios, eventos y estadísticas
 * Diferencia permisos entre super_admin y admin (organizador)
 */

import { supabase } from '@/lib/supabase';
import { Result, AppError, handleError } from '@/utils/errors';

export interface DashboardMetrics {
  totalEvents: number;
  activeEvents: number;
  totalSales: number;
  totalRevenue: number;
  totalUsers: number;
  totalValidators: number;
  recentActivity: ActivityLog[];
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  metadata?: any;
}

export interface UserManagement {
  id: string;
  email: string;
  fullName: string;
  role: 'user' | 'qr_validator' | 'admin' | 'super_admin';
  createdAt: string;
  lastLogin?: string;
}

export interface EventStatistics {
  eventId: string;
  eventTitle: string;
  totalTicketsSold: number;
  revenue: number;
  availableTickets: number;
  validatedTickets: number;
  validationRate: number;
}

export interface SalesReport {
  date: string;
  eventTitle: string;
  ticketsSold: number;
  revenue: number;
  paymentMethod: string;
}

export class AdminService {
  /**
   * Obtiene métricas del dashboard
   * Super Admin: Ve todas las métricas globales
   * Admin: Ve solo métricas de sus eventos
   */
  static async getDashboardMetrics(
    userId: string,
    userRole: string
  ): Promise<Result<DashboardMetrics>> {
    try {
      const isSuperAdmin = userRole === 'super_admin';

      // Obtener eventos (filtrados por rol)
      let eventsQuery = supabase.from('events').select('id, status, created_by');

      if (!isSuperAdmin) {
        eventsQuery = eventsQuery.eq('created_by', userId);
      }

      const { data: events, error: eventsError } = await eventsQuery;

      if (eventsError) throw eventsError;

      const totalEvents = events?.length || 0;
      const activeEvents = events?.filter((e) => e.status === 'active').length || 0;

      // Obtener ventas (filtradas por rol)
      let purchasesQuery = supabase
        .from('purchases')
        .select('total_amount, event_id, created_at');

      if (!isSuperAdmin) {
        const eventIds = events?.map((e) => e.id) || [];
        purchasesQuery = purchasesQuery.in('event_id', eventIds);
      }

      const { data: purchases, error: purchasesError } = await purchasesQuery;

      if (purchasesError) throw purchasesError;

      const totalSales = purchases?.length || 0;
      const totalRevenue = purchases?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;

      // Obtener usuarios (solo super_admin)
      let totalUsers = 0;
      let totalValidators = 0;

      if (isSuperAdmin) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('role');

        if (usersError) throw usersError;

        totalUsers = users?.length || 0;
        totalValidators = users?.filter((u) => u.role === 'qr_validator').length || 0;
      }

      // Obtener actividad reciente (filtrada por rol)
      let activityQuery = supabase
        .from('activity_log')
        .select(`
          id,
          user_id,
          action,
          entity_type,
          entity_id,
          timestamp,
          metadata,
          users:user_id (full_name, email)
        `)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (!isSuperAdmin) {
        // Admin solo ve actividad relacionada a sus eventos
        const eventIds = events?.map((e) => e.id) || [];
        activityQuery = activityQuery.or(
          `entity_id.in.(${eventIds.join(',')}),user_id.eq.${userId}`
        );
      }

      const { data: activity, error: activityError } = await activityQuery;

      if (activityError) throw activityError;

      const recentActivity: ActivityLog[] =
        activity?.map((a: any) => ({
          id: a.id,
          userId: a.user_id,
          userName: a.users?.full_name || a.users?.email || 'Usuario',
          action: a.action,
          entityType: a.entity_type,
          entityId: a.entity_id,
          timestamp: a.timestamp,
          metadata: a.metadata,
        })) || [];

      return {
        success: true,
        data: {
          totalEvents,
          activeEvents,
          totalSales,
          totalRevenue,
          totalUsers,
          totalValidators,
          recentActivity,
        },
      };
    } catch (error) {
      return handleError(error, 'AdminService.getDashboardMetrics');
    }
  }

  /**
   * Obtiene lista de usuarios (SOLO SUPER_ADMIN)
   */
  static async getUsers(userRole: string): Promise<Result<UserManagement[]>> {
    try {
      if (userRole !== 'super_admin') {
        throw new AppError(
          'PERMISSION_DENIED',
          'Solo super_admin puede ver todos los usuarios',
          403
        );
      }

      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const users: UserManagement[] =
        data?.map((u) => ({
          id: u.id,
          email: u.email,
          fullName: u.full_name,
          role: u.role,
          createdAt: u.created_at,
        })) || [];

      return { success: true, data: users };
    } catch (error) {
      return handleError(error, 'AdminService.getUsers');
    }
  }

  /**
   * Actualiza el rol de un usuario (SOLO SUPER_ADMIN)
   */
  static async updateUserRole(
    userId: string,
    newRole: string,
    adminRole: string
  ): Promise<Result<void>> {
    try {
      if (adminRole !== 'super_admin') {
        throw new AppError(
          'PERMISSION_DENIED',
          'Solo super_admin puede cambiar roles de usuario',
          403
        );
      }

      const validRoles = ['user', 'qr_validator', 'admin', 'super_admin'];
      if (!validRoles.includes(newRole)) {
        throw new AppError('INVALID_INPUT', `Rol inválido: ${newRole}`, 400);
      }

      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      return { success: true, data: undefined };
    } catch (error) {
      return handleError(error, 'AdminService.updateUserRole');
    }
  }

  /**
   * Elimina un usuario (SOLO SUPER_ADMIN)
   */
  static async deleteUser(userId: string, adminRole: string): Promise<Result<void>> {
    try {
      if (adminRole !== 'super_admin') {
        throw new AppError(
          'PERMISSION_DENIED',
          'Solo super_admin puede eliminar usuarios',
          403
        );
      }

      const { error } = await supabase.from('users').delete().eq('id', userId);

      if (error) throw error;

      return { success: true, data: undefined };
    } catch (error) {
      return handleError(error, 'AdminService.deleteUser');
    }
  }

  /**
   * Obtiene estadísticas de eventos
   * Super Admin: Todos los eventos
   * Admin: Solo sus eventos
   */
  static async getEventStatistics(
    userId: string,
    userRole: string
  ): Promise<Result<EventStatistics[]>> {
    try {
      const isSuperAdmin = userRole === 'super_admin';

      // Obtener eventos con ventas y validaciones
      let eventsQuery = supabase.from('events').select(`
        id,
        title,
        total_tickets,
        available_tickets,
        purchases (
          id,
          quantity,
          total_amount,
          tickets (
            id,
            is_used
          )
        )
      `);

      if (!isSuperAdmin) {
        eventsQuery = eventsQuery.eq('created_by', userId);
      }

      const { data: events, error } = await eventsQuery;

      if (error) throw error;

      const statistics: EventStatistics[] =
        events?.map((event: any) => {
          const totalTicketsSold =
            event.purchases?.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0) || 0;

          const revenue =
            event.purchases?.reduce((sum: number, p: any) => sum + (p.total_amount || 0), 0) || 0;

          const allTickets = event.purchases?.flatMap((p: any) => p.tickets || []) || [];
          const validatedTickets = allTickets.filter((t: any) => t.is_used).length;
          const validationRate =
            totalTicketsSold > 0 ? (validatedTickets / totalTicketsSold) * 100 : 0;

          return {
            eventId: event.id,
            eventTitle: event.title,
            totalTicketsSold,
            revenue,
            availableTickets: event.available_tickets || 0,
            validatedTickets,
            validationRate,
          };
        }) || [];

      return { success: true, data: statistics };
    } catch (error) {
      return handleError(error, 'AdminService.getEventStatistics');
    }
  }

  /**
   * Obtiene reporte de ventas
   * Super Admin: Todas las ventas
   * Admin: Solo ventas de sus eventos
   */
  static async getSalesReport(
    userId: string,
    userRole: string,
    startDate?: string,
    endDate?: string
  ): Promise<Result<SalesReport[]>> {
    try {
      const isSuperAdmin = userRole === 'super_admin';

      let purchasesQuery = supabase.from('purchases').select(`
        created_at,
        quantity,
        total_amount,
        payment_method,
        events:event_id (
          title,
          created_by
        )
      `);

      if (!isSuperAdmin) {
        purchasesQuery = purchasesQuery.eq('events.created_by', userId);
      }

      if (startDate) {
        purchasesQuery = purchasesQuery.gte('created_at', startDate);
      }

      if (endDate) {
        purchasesQuery = purchasesQuery.lte('created_at', endDate);
      }

      purchasesQuery = purchasesQuery.order('created_at', { ascending: false });

      const { data: purchases, error } = await purchasesQuery;

      if (error) throw error;

      const salesReport: SalesReport[] =
        purchases?.map((p: any) => ({
          date: p.created_at,
          eventTitle: p.events?.title || 'Evento desconocido',
          ticketsSold: p.quantity,
          revenue: p.total_amount,
          paymentMethod: p.payment_method,
        })) || [];

      return { success: true, data: salesReport };
    } catch (error) {
      return handleError(error, 'AdminService.getSalesReport');
    }
  }

  /**
   * Asigna un validador a un evento
   * Admin: Solo a sus eventos
   * Super Admin: A cualquier evento
   */
  static async assignValidator(
    eventId: string,
    validatorId: string,
    assignedBy: string,
    assignedByRole: string
  ): Promise<Result<void>> {
    try {
      const isAdmin = assignedByRole === 'admin' || assignedByRole === 'super_admin';

      if (!isAdmin) {
        throw new AppError(
          'PERMISSION_DENIED',
          'Solo admin y super_admin pueden asignar validadores',
          403
        );
      }

      // Verificar que el usuario sea validador
      const { data: validator, error: validatorError } = await supabase
        .from('users')
        .select('role')
        .eq('id', validatorId)
        .single();

      if (validatorError) throw validatorError;

      if (validator.role !== 'qr_validator') {
        throw new AppError(
          'INVALID_INPUT',
          'El usuario seleccionado no es un validador',
          400
        );
      }

      // Si es admin (no super_admin), verificar que sea dueño del evento
      if (assignedByRole === 'admin') {
        const { data: event, error: eventError } = await supabase
          .from('events')
          .select('created_by')
          .eq('id', eventId)
          .single();

        if (eventError) throw eventError;

        if (event.created_by !== assignedBy) {
          throw new AppError(
            'PERMISSION_DENIED',
            'Solo puedes asignar validadores a tus propios eventos',
            403
          );
        }
      }

      // Asignar validador
      const { error } = await supabase.from('validator_assignments').insert({
        event_id: eventId,
        validator_id: validatorId,
        assigned_by: assignedBy,
      });

      if (error) {
        if (error.code === '23505') {
          throw new AppError(
            'DUPLICATE_ENTRY',
            'Este validador ya está asignado a este evento',
            409
          );
        }
        throw error;
      }

      return { success: true, data: undefined };
    } catch (error) {
      return handleError(error, 'AdminService.assignValidator');
    }
  }

  /**
   * Elimina la asignación de un validador
   */
  static async removeValidatorAssignment(
    assignmentId: string,
    userId: string,
    userRole: string
  ): Promise<Result<void>> {
    try {
      const isSuperAdmin = userRole === 'super_admin';

      if (!isSuperAdmin) {
        // Verificar que el admin sea dueño del evento
        const { data: assignment, error: assignmentError } = await supabase
          .from('validator_assignments')
          .select('event_id, events:event_id(created_by)')
          .eq('id', assignmentId)
          .single();

        if (assignmentError) throw assignmentError;

        if ((assignment as any).events?.created_by !== userId) {
          throw new AppError(
            'PERMISSION_DENIED',
            'Solo puedes remover validadores de tus propios eventos',
            403
          );
        }
      }

      const { error } = await supabase
        .from('validator_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      return { success: true, data: undefined };
    } catch (error) {
      return handleError(error, 'AdminService.removeValidatorAssignment');
    }
  }

  /**
   * Obtiene validadores asignados a un evento
   */
  static async getEventValidators(eventId: string): Promise<
    Result<
      Array<{
        id: string;
        validatorId: string;
        validatorName: string;
        validatorEmail: string;
        assignedAt: string;
      }>
    >
  > {
    try {
      const { data, error } = await supabase
        .from('validator_assignments')
        .select(`
          id,
          validator_id,
          assigned_at,
          users:validator_id (
            full_name,
            email
          )
        `)
        .eq('event_id', eventId);

      if (error) throw error;

      const validators =
        data?.map((v: any) => ({
          id: v.id,
          validatorId: v.validator_id,
          validatorName: v.users?.full_name || 'Validador',
          validatorEmail: v.users?.email,
          assignedAt: v.assigned_at,
        })) || [];

      return { success: true, data: validators };
    } catch (error) {
      return handleError(error, 'AdminService.getEventValidators');
    }
  }

  /**
   * Obtiene lista de validadores disponibles
   */
  static async getAvailableValidators(): Promise<
    Result<Array<{ id: string; name: string; email: string }>>
  > {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('role', 'qr_validator')
        .order('full_name');

      if (error) throw error;

      const validators =
        data?.map((v) => ({
          id: v.id,
          name: v.full_name,
          email: v.email,
        })) || [];

      return { success: true, data: validators };
    } catch (error) {
      return handleError(error, 'AdminService.getAvailableValidators');
    }
  }
}
