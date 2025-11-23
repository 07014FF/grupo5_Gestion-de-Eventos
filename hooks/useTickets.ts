/**
 * Custom Hooks for Ticket Management with TanStack Query
 * Provides optimized data fetching, caching, and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TicketServiceSupabase } from '@/services/ticket.service.supabase';
import type { Event, UserInfo, PaymentMethod } from '@/types/ticket.types';

/**
 * Query Keys for caching and invalidation
 */
export const ticketKeys = {
  all: ['tickets'] as const,
  user: (userId: string) => [...ticketKeys.all, 'user', userId] as const,
  byId: (ticketId: string) => [...ticketKeys.all, 'detail', ticketId] as const,
  purchases: (userId: string) => ['purchases', userId] as const,
};

/**
 * Hook para obtener los tickets del usuario
 * Incluye caché automático y refetch inteligente
 */
export function useUserTickets(userId: string) {
  return useQuery({
    queryKey: ticketKeys.user(userId),
    queryFn: async () => {
      const result = await TicketServiceSupabase.getUserTickets(userId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!userId, // Solo ejecutar si hay userId
    staleTime: 1000 * 60 * 2, // Datos válidos por 2 minutos
  });
}

/**
 * Hook para obtener un ticket específico por ID
 */
export function useTicket(ticketId: string) {
  return useQuery({
    queryKey: ticketKeys.byId(ticketId),
    queryFn: async () => {
      const result = await TicketServiceSupabase.getTicketById(ticketId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!ticketId,
    staleTime: 1000 * 60 * 5, // Ticket individual válido por 5 minutos
  });
}

/**
 * Hook para obtener el historial de compras
 */
export function usePurchaseHistory(userId: string) {
  return useQuery({
    queryKey: ticketKeys.purchases(userId),
    queryFn: async () => {
      const result = await TicketServiceSupabase.getPurchaseHistory(userId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 3, // Válido por 3 minutos
  });
}

/**
 * Hook para crear una nueva compra de tickets
 * Incluye invalidación automática de caché
 */
export function useCreatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      event: Event;
      quantity: number;
      userInfo: UserInfo;
      paymentMethod: PaymentMethod;
      userId: string;
      paymentResult?: {
        paymentId: string;
        transactionId?: string;
        receiptUrl?: string;
        gateway: string;
        metadata?: any;
      };
    }) => {
      const result = await TicketServiceSupabase.createPurchase(
        params.event,
        params.quantity,
        params.userInfo,
        params.paymentMethod,
        params.userId,
        params.paymentResult
      );

      if (!result.success) {
        throw result.error;
      }

      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidar caché de tickets del usuario para refrescar la lista
      queryClient.invalidateQueries({
        queryKey: ticketKeys.user(variables.userId),
      });

      // Invalidar caché de historial de compras
      queryClient.invalidateQueries({
        queryKey: ticketKeys.purchases(variables.userId),
      });

      // Invalidar caché de eventos para actualizar available_tickets
      queryClient.invalidateQueries({
        queryKey: ['events'],
      });
    },
  });
}

/**
 * Hook para marcar un ticket como usado (validación)
 * Incluye invalidación automática de caché
 */
export function useMarkTicketAsUsed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      ticketId: string;
      validatedBy: string;
    }) => {
      const result = await TicketServiceSupabase.markTicketAsUsed(
        params.ticketId,
        params.validatedBy
      );

      if (!result.success) {
        throw result.error;
      }

      return result.data;
    },
    onSuccess: (data) => {
      // Invalidar el ticket específico
      queryClient.invalidateQueries({
        queryKey: ticketKeys.byId(data.id),
      });

      // Invalidar tickets del usuario
      queryClient.invalidateQueries({
        queryKey: ticketKeys.user(data.userId),
      });
    },
  });
}

/**
 * Hook para prefetch (pre-cargar) tickets del usuario
 * Útil para mejorar la UX al navegar entre pantallas
 */
export function usePrefetchUserTickets() {
  const queryClient = useQueryClient();

  return async (userId: string) => {
    await queryClient.prefetchQuery({
      queryKey: ticketKeys.user(userId),
      queryFn: async () => {
        const result = await TicketServiceSupabase.getUserTickets(userId);
        if (!result.success) {
          throw result.error;
        }
        return result.data;
      },
      staleTime: 1000 * 60 * 2,
    });
  };
}
