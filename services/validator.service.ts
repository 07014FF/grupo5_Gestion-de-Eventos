/**
 * Servicio de Validación de Entradas
 * Soporta modo offline con sincronización automática
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { ErrorHandler, AppError, ErrorCode, Ok, Err, Result } from '@/utils/errors';
import type {
  TicketValidation,
  ValidationResult,
  ValidatorStats,
  OfflineValidation,
  ValidatorEvent,
} from '@/types/validator.types';

// ============================================================================
// CONSTANTES
// ============================================================================

const OFFLINE_VALIDATIONS_KEY = '@validations_offline';
const LAST_SYNC_KEY = '@validations_last_sync';

// ============================================================================
// SERVICIO DE VALIDACIÓN
// ============================================================================

export class ValidatorService {
  /**
   * Validar un ticket por código o QR
   */
  static async validateTicket(
    ticketCode: string,
    eventId: string,
    validatorId: string,
    validatorName: string
  ): Promise<Result<ValidationResult>> {
    const startTime = Date.now();

    try {
      // 1. Parsear el QR data
      let actualTicketCode: string;
      try {
        const qrData = JSON.parse(ticketCode);
        actualTicketCode = qrData.ticketId; // ticketId en QR = ticket_code
        console.log('🔍 [VALIDATOR] QR parseado');
        console.log('   📋 ticket_code:', actualTicketCode);
        console.log('   🎫 event_id:', eventId);
      } catch (parseError) {
        actualTicketCode = ticketCode;
        console.log('🔍 [VALIDATOR] QR directo:', actualTicketCode);
      }

      // 2. VALIDACIÓN COMPLETA EN UN SOLO PASO (todo automático)
      const { data: result, error: rpcError } = await supabase
        .rpc('complete_ticket_validation', {
          p_ticket_code: actualTicketCode,
          p_event_id: eventId,
          p_validator_id: validatorId,
        });

      const duration = Date.now() - startTime;

      if (rpcError) {
        console.error('❌ [VALIDATOR] Error en validación:', rpcError);
        console.error(`   ⏱️ Duración: ${duration}ms`);
        return Ok({
          success: false,
          status: 'invalid',
          message: 'Error al validar ticket. Intenta nuevamente.',
        });
      }

      // Log del resultado
      console.log(`${result.success ? '✅' : '❌'} [VALIDATOR] ${result.message}`);
      console.log(`   ⏱️ Duración: ${duration}ms`);
      if (result.ticket) {
        console.log(`   📊 Cantidad: ${result.ticket.quantity}`);
        console.log(`   👤 Usuario: ${result.ticket.userName}`);
      }

      // Retornar el resultado directo de la función RPC
      return Ok({
        success: result.success,
        status: result.status,
        message: result.message,
        ticket: result.ticket,
      });

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error('❌ [VALIDATOR] Error crítico');
      console.error(`   ⏱️ Duración: ${duration}ms`);
      console.error('   📋 Error:', error);

      ErrorHandler.log(error, 'ValidatorService.validateTicket');
      return Err(
        new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Validation failed',
          'Error al validar el ticket. Intenta nuevamente.'
        )
      );
    }
  }

  /**
   * Obtener eventos disponibles para validar
   */
  static async getValidatorEvents(): Promise<Result<ValidatorEvent[]>> {
    try {
      // Primero obtenemos los eventos
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, title, date, location, total_tickets')
        .order('date', { ascending: true });

      if (eventsError) throw eventsError;
      if (!events) return Ok([]);

      // Luego obtenemos el conteo de validaciones para cada evento
      const validatorEvents: ValidatorEvent[] = await Promise.all(
        events.map(async (event: any) => {
          const { count, error: countError } = await supabase
            .from('ticket_validations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);

          return {
            id: event.id,
            title: event.title,
            date: event.date,
            location: event.location,
            capacity: event.total_tickets || 0,
            validatedCount: count || 0,
            isActive: new Date(event.date) >= new Date(),
          };
        })
      );

      return Ok(validatorEvents);
    } catch (error: any) {
      ErrorHandler.log(error, 'ValidatorService.getValidatorEvents');
      return Err(
        new AppError(ErrorCode.UNKNOWN_ERROR, 'Failed to fetch events')
      );
    }
  }

  /**
   * Obtener estadísticas de validación para un evento
   */
  static async getValidatorStats(eventId: string): Promise<Result<ValidatorStats>> {
    try {
      // Obtener información del evento
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, title, total_tickets')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      // Obtener todas las validaciones del evento sin la relación ambigua
      const { data: validations, error: validationsError } = await supabase
        .from('ticket_validations')
        .select('id, validated_at, ticket_id')
        .eq('event_id', eventId);

      if (validationsError) throw validationsError;

      // Obtener información de purchases por separado
      const purchaseIds = validations?.map(v => v.ticket_id).filter(Boolean) || [];
      const { data: purchases } = await supabase
        .from('purchases')
        .select('id, ticket_type, total_amount, quantity')
        .in('id', purchaseIds);

      // Crear un mapa de purchases por id
      const purchaseMap = new Map(purchases?.map(p => [p.id, p]) || []);

      // Calcular estadísticas
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let totalValidated = 0;
      let validatedToday = 0;
      let generalCount = 0;
      let studentCount = 0;
      let totalRevenue = 0;
      let todayRevenue = 0;
      const hourlyData: Record<string, number> = {};

      validations?.forEach((validation: any) => {
        const validatedAt = new Date(validation.validated_at);
        const purchase = purchaseMap.get(validation.ticket_id);

        totalValidated += purchase?.quantity || 1;
        totalRevenue += purchase?.total_amount || 0;

        if (validatedAt >= todayStart) {
          validatedToday += purchase?.quantity || 1;
          todayRevenue += purchase?.total_amount || 0;

          // Agrupar por hora
          const hour = validatedAt.getHours();
          const hourKey = `${hour.toString().padStart(2, '0')}:00`;
          hourlyData[hourKey] = (hourlyData[hourKey] || 0) + (purchase?.quantity || 1);
        }

        if (purchase?.ticket_type === 'general') {
          generalCount += purchase?.quantity || 1;
        } else {
          studentCount += purchase?.quantity || 1;
        }
      });

      // Convertir hourlyData a array ordenado
      const validatedByHour = Object.entries(hourlyData)
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour.localeCompare(b.hour));

      // Última validación
      const lastValidation = validations && validations.length > 0
        ? {
            time: validations[validations.length - 1].validated_at,
            userName: 'Usuario', // TODO: Agregar nombre del usuario
          }
        : undefined;

      const stats: ValidatorStats = {
        eventId,
        eventTitle: event.title,
        totalCapacity: event.total_tickets || 0,
        totalValidated,
        validatedToday,
        validatedByType: {
          general: generalCount,
          student: studentCount,
        },
        validatedByHour,
        revenue: {
          total: totalRevenue,
          today: todayRevenue,
        },
        lastValidation,
      };

      return Ok(stats);
    } catch (error: any) {
      ErrorHandler.log(error, 'ValidatorService.getValidatorStats');
      return Err(
        new AppError(ErrorCode.UNKNOWN_ERROR, 'Failed to fetch stats')
      );
    }
  }

  /**
   * Obtener lista de validaciones recientes para un evento
   */
  static async getRecentValidations(
    eventId: string,
    limit = 10
  ): Promise<Result<TicketValidation[]>> {
    try {
      // Obtener validaciones recientes sin relaciones ambiguas
      const { data: validations, error: validationsError } = await supabase
        .from('ticket_validations')
        .select('id, validated_at, validated_by, ticket_id')
        .eq('event_id', eventId)
        .order('validated_at', { ascending: false })
        .limit(limit);

      if (validationsError) throw validationsError;
      if (!validations || validations.length === 0) return Ok([]);

      // Obtener información de purchases
      const ticketIds = validations.map(v => v.ticket_id).filter(Boolean);
      const { data: purchases } = await supabase
        .from('purchases')
        .select('id, ticket_code, event_id, user_id, user_name, ticket_type, quantity, total_amount')
        .in('id', ticketIds);

      // Obtener información de validadores
      const validatorIds = validations.map(v => v.validated_by).filter(Boolean);
      const { data: validators } = await supabase
        .from('users')
        .select('id, email')
        .in('id', validatorIds);

      // Obtener información de usuarios (compradores)
      const userIds = purchases?.map(p => p.user_id).filter(Boolean) || [];
      const { data: users } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds);

      // Crear mapas para lookup rápido
      const purchaseMap = new Map(purchases?.map(p => [p.id, p]) || []);
      const validatorMap = new Map(validators?.map(v => [v.id, v]) || []);
      const userMap = new Map(users?.map(u => [u.id, u]) || []);

      const recentValidations: TicketValidation[] = validations.map((v: any) => {
        const purchase = purchaseMap.get(v.ticket_id);
        const validator = validatorMap.get(v.validated_by);
        const user = purchase ? userMap.get(purchase.user_id) : null;

        return {
          id: v.id,
          ticketId: purchase?.id || '',
          ticketCode: purchase?.ticket_code || '',
          eventId: purchase?.event_id || eventId,
          eventTitle: 'Evento',
          userId: purchase?.user_id || '',
          userName: purchase?.user_name || 'N/A',
          userEmail: user?.email || '',
          ticketType: purchase?.ticket_type || 'general',
          quantity: purchase?.quantity || 1,
          totalAmount: purchase?.total_amount || 0,
          validatedAt: v.validated_at,
          validatedBy: v.validated_by,
          validatorName: validator?.email || 'Desconocido',
          status: 'valid',
          synced: true,
        };
      });

      return Ok(recentValidations);
    } catch (error: any) {
      ErrorHandler.log(error, 'ValidatorService.getRecentValidations');
      return Err(
        new AppError(ErrorCode.UNKNOWN_ERROR, 'Failed to fetch recent validations')
      );
    }
  }

  // ==========================================================================
  // MODO OFFLINE
  // ==========================================================================

  /**
   * Guardar validación offline
   */
  static async saveOfflineValidation(
    ticketCode: string,
    eventId: string,
    validatorId: string
  ): Promise<void> {
    try {
      const offlineValidation: OfflineValidation = {
        id: `offline_${Date.now()}`,
        ticketCode,
        eventId,
        validatedAt: new Date().toISOString(),
        validatedBy: validatorId,
        synced: false,
        syncAttempts: 0,
      };

      const existing = await this.getOfflineValidations();
      const updated = [...existing, offlineValidation];

      await AsyncStorage.setItem(
        OFFLINE_VALIDATIONS_KEY,
        JSON.stringify(updated)
      );

      console.log('💾 Validación guardada offline');
    } catch (error) {
      ErrorHandler.log(error, 'ValidatorService.saveOfflineValidation');
    }
  }

  /**
   * Obtener validaciones offline pendientes
   */
  static async getOfflineValidations(): Promise<OfflineValidation[]> {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_VALIDATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      ErrorHandler.log(error, 'ValidatorService.getOfflineValidations');
      return [];
    }
  }

  /**
   * Sincronizar validaciones offline
   */
  static async syncOfflineValidations(): Promise<Result<number>> {
    try {
      const offlineValidations = await this.getOfflineValidations();
      const pendingValidations = offlineValidations.filter((v) => !v.synced);

      if (pendingValidations.length === 0) {
        console.log('✅ No hay validaciones pendientes');
        return Ok(0);
      }

      console.log(`🔄 Sincronizando ${pendingValidations.length} validaciones...`);

      let syncedCount = 0;
      const updatedValidations = [...offlineValidations];

      for (const validation of pendingValidations) {
        try {
          // Parsear ticketCode para obtener el ticket_code real
          let actualTicketCode: string;
          try {
            const qrData = JSON.parse(validation.ticketCode);
            actualTicketCode = qrData.ticketId; // ticketId en QR = ticket_code
          } catch {
            actualTicketCode = validation.ticketCode;
          }

          // Buscar el ticket por ticket_code coherente
          const { data: ticket } = await supabase
            .from('tickets')
            .select('id, event_id')
            .eq('ticket_code', actualTicketCode)
            .eq('event_id', validation.eventId)
            .maybeSingle();

          if (ticket) {
            // Registrar validación
            const { error } = await supabase
              .from('ticket_validations')
              .insert({
                ticket_id: ticket.id,
                event_id: validation.eventId,
                validated_by: validation.validatedBy,
                validated_at: validation.validatedAt,
              });

            if (!error) {
              // Marcar el ticket como usado
              await supabase
                .from('tickets')
                .update({
                  status: 'used',
                  used_at: validation.validatedAt,
                  validated_by: validation.validatedBy,
                })
                .eq('id', ticket.id);

              // Marcar como sincronizado
              const index = updatedValidations.findIndex((v) => v.id === validation.id);
              if (index !== -1) {
                updatedValidations[index].synced = true;
                syncedCount++;
              }
            } else {
              // Incrementar intentos
              const index = updatedValidations.findIndex((v) => v.id === validation.id);
              if (index !== -1) {
                updatedValidations[index].syncAttempts += 1;
                updatedValidations[index].lastSyncAttempt = new Date().toISOString();
              }
            }
          }
        } catch (err) {
          ErrorHandler.log(err, 'ValidatorService.syncOfflineValidations.item');
        }
      }

      // Guardar validaciones actualizadas
      await AsyncStorage.setItem(
        OFFLINE_VALIDATIONS_KEY,
        JSON.stringify(updatedValidations)
      );

      // Actualizar última sincronización
      await AsyncStorage.setItem(
        LAST_SYNC_KEY,
        new Date().toISOString()
      );

      console.log(`✅ Sincronizadas ${syncedCount} validaciones`);
      return Ok(syncedCount);
    } catch (error: any) {
      ErrorHandler.log(error, 'ValidatorService.syncOfflineValidations');
      return Err(
        new AppError(ErrorCode.UNKNOWN_ERROR, 'Sync failed')
      );
    }
  }

  /**
   * Limpiar validaciones sincronizadas
   */
  static async clearSyncedValidations(): Promise<void> {
    try {
      const validations = await this.getOfflineValidations();
      const pending = validations.filter((v) => !v.synced);

      await AsyncStorage.setItem(
        OFFLINE_VALIDATIONS_KEY,
        JSON.stringify(pending)
      );

      console.log('🧹 Validaciones sincronizadas eliminadas');
    } catch (error) {
      ErrorHandler.log(error, 'ValidatorService.clearSyncedValidations');
    }
  }

  /**
   * Obtener última fecha de sincronización
   */
  static async getLastSyncDate(): Promise<Date | null> {
    try {
      const data = await AsyncStorage.getItem(LAST_SYNC_KEY);
      return data ? new Date(data) : null;
    } catch (error) {
      ErrorHandler.log(error, 'ValidatorService.getLastSyncDate');
      return null;
    }
  }
}
