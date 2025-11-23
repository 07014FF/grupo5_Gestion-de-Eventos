/**
 * Servicio de Validación de Entradas - COMPLETAMENTE REFACTORIZADO
 * Usa la tabla CORRECTA: validations (no ticket_validations)
 * Funciona perfectamente para pruebas end-to-end
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
// SERVICIO DE VALIDACIÓN - USANDO TABLA CORRECTA (validations)
// ============================================================================

export class ValidatorService {
  /**
   * Validar un ticket por código o QR
   * Usa la función RPC que valida TODO automáticamente
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
      let eventIdFromQR: string | null = null;

      try {
        const qrData = JSON.parse(ticketCode);
        actualTicketCode = qrData.ticketId; // ticketId en QR = ticket_code
        eventIdFromQR = qrData.eventId; // Detectar evento automáticamente

        console.log('🔍 [VALIDATOR] QR parseado');
        console.log('   📋 ticket_code:', actualTicketCode);
        console.log('   🎫 event_id (QR):', eventIdFromQR);
        console.log('   🎫 event_id (param):', eventId);
      } catch (parseError) {
        actualTicketCode = ticketCode;
        console.log('🔍 [VALIDATOR] QR directo:', actualTicketCode);
      }

      // 2. Usar event_id del QR si está disponible, sino usar el parámetro
      const finalEventId = eventIdFromQR || eventId;

      // 3. VALIDACIÓN COMPLETA EN UN SOLO PASO (todo automático)
      const { data: result, error: rpcError } = await supabase
        .rpc('complete_ticket_validation', {
          p_ticket_code: actualTicketCode,
          p_event_id: finalEventId,
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
        console.log(`   🎫 Evento: ${result.ticket.eventTitle}`);
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
   * CORREGIDO: Usa tabla validations (no ticket_validations)
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
      // CORREGIDO: Ejecutar subquery primero, luego usar el resultado
      const validatorEvents: ValidatorEvent[] = await Promise.all(
        events.map(async (event: any) => {
          // PASO 1: Obtener IDs de tickets para este evento
          const { data: eventTickets } = await supabase
            .from('tickets')
            .select('id')
            .eq('event_id', event.id);

          const ticketIds = eventTickets?.map(t => t.id) || [];

          // PASO 2: Contar validaciones usando esos ticket IDs
          const { data: eventValidations } = await supabase
            .from('validations')
            .select('id')
            .in('ticket_id', ticketIds); // Ahora recibe un array, no un Promise

          return {
            id: event.id,
            title: event.title,
            date: event.date,
            location: event.location,
            capacity: event.total_tickets || 0,
            validatedCount: eventValidations?.length || 0,
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
   * COMPLETAMENTE REESCRITO para usar tabla validations
   */
  static async getValidatorStats(eventId: string): Promise<Result<ValidatorStats>> {
    try {
      // 1. Obtener información del evento
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, title, total_tickets')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      // 2. Obtener tickets del evento
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('id, purchase_id, quantity, ticket_type, price')
        .eq('event_id', eventId);

      if (ticketsError) throw ticketsError;

      const ticketIds = tickets?.map(t => t.id) || [];

      // 3. Obtener validaciones de esos tickets (tabla CORRECTA: validations)
      const { data: validations, error: validationsError } = await supabase
        .from('validations')
        .select('id, ticket_id, validated_by, created_at, validation_result')
        .in('ticket_id', ticketIds)
        .eq('validation_result', 'valid');

      if (validationsError) throw validationsError;

      // 4. Obtener información de purchases
      const purchaseIds = [...new Set(tickets?.map(t => t.purchase_id) || [])];
      const { data: purchases } = await supabase
        .from('purchases')
        .select('id, total_amount, user_name')
        .in('id', purchaseIds);

      // Crear mapas para lookup rápido
      const ticketMap = new Map(tickets?.map(t => [t.id, t]) || []);
      const purchaseMap = new Map(purchases?.map(p => [p.id, p]) || []);

      // 5. Calcular estadísticas
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
        const validatedAt = new Date(validation.created_at); // CORREGIDO: created_at
        const ticket = ticketMap.get(validation.ticket_id);
        const purchase = ticket ? purchaseMap.get(ticket.purchase_id) : null;

        const quantity = ticket?.quantity || 1;
        const amount = purchase?.total_amount || 0;

        totalValidated += quantity;
        totalRevenue += amount;

        if (validatedAt >= todayStart) {
          validatedToday += quantity;
          todayRevenue += amount;

          // Agrupar por hora
          const hour = validatedAt.getHours();
          const hourKey = `${hour.toString().padStart(2, '0')}:00`;
          hourlyData[hourKey] = (hourlyData[hourKey] || 0) + quantity;
        }

        if (ticket?.ticket_type?.toLowerCase().includes('general')) {
          generalCount += quantity;
        } else {
          studentCount += quantity;
        }
      });

      // Convertir hourlyData a array ordenado
      const validatedByHour = Object.entries(hourlyData)
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour.localeCompare(b.hour));

      // Última validación
      const lastValidation = validations && validations.length > 0
        ? {
            time: validations[validations.length - 1].created_at,
            userName: 'Usuario',
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
   * COMPLETAMENTE REESCRITO para usar tabla validations
   */
  static async getRecentValidations(
    eventId: string,
    limit = 10
  ): Promise<Result<TicketValidation[]>> {
    try {
      // 1. Obtener tickets del evento
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('id, ticket_code, purchase_id, user_id, quantity, ticket_type, price')
        .eq('event_id', eventId);

      if (ticketsError) throw ticketsError;
      if (!tickets || tickets.length === 0) return Ok([]);

      const ticketIds = tickets.map(t => t.id);

      // 2. Obtener validaciones recientes (tabla CORRECTA: validations)
      const { data: validations, error: validationsError } = await supabase
        .from('validations')
        .select('id, ticket_id, validated_by, created_at, validation_result, validation_message')
        .in('ticket_id', ticketIds)
        .eq('validation_result', 'valid')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (validationsError) throw validationsError;
      if (!validations || validations.length === 0) return Ok([]);

      // 3. Obtener información adicional
      const purchaseIds = tickets.map(t => t.purchase_id);
      const validatorIds = validations.map(v => v.validated_by);
      const userIds = tickets.map(t => t.user_id);

      const { data: purchases } = await supabase
        .from('purchases')
        .select('id, user_name, user_email, total_amount')
        .in('id', purchaseIds);

      const { data: validators } = await supabase
        .from('users')
        .select('id, email, name')
        .in('id', validatorIds);

      // Crear mapas
      const ticketMap = new Map(tickets.map(t => [t.id, t]));
      const purchaseMap = new Map(purchases?.map(p => [p.id, p]) || []);
      const validatorMap = new Map(validators?.map(v => [v.id, v]) || []);

      // 4. Construir resultado
      const recentValidations: TicketValidation[] = validations.map((v: any) => {
        const ticket = ticketMap.get(v.ticket_id);
        const purchase = ticket ? purchaseMap.get(ticket.purchase_id) : null;
        const validator = validatorMap.get(v.validated_by);

        return {
          id: v.id,
          ticketId: ticket?.id || '',
          ticketCode: ticket?.ticket_code || '',
          eventId: eventId,
          eventTitle: 'Evento',
          userId: ticket?.user_id || '',
          userName: purchase?.user_name || 'N/A',
          userEmail: purchase?.user_email || '',
          ticketType: ticket?.ticket_type || 'General',
          quantity: ticket?.quantity || 1,
          totalAmount: purchase?.total_amount || 0,
          validatedAt: v.created_at, // CORREGIDO: created_at
          validatedBy: v.validated_by,
          validatorName: validator?.name || validator?.email || 'Desconocido',
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
  // MODO OFFLINE - SIMPLIFICADO
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
   * SIMPLIFICADO: Usa la función RPC en lugar de inserts manuales
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
          // Parsear ticketCode
          let actualTicketCode: string;
          try {
            const qrData = JSON.parse(validation.ticketCode);
            actualTicketCode = qrData.ticketId;
          } catch {
            actualTicketCode = validation.ticketCode;
          }

          // Usar la función RPC para validar (más simple y robusto)
          const { data: result, error } = await supabase
            .rpc('complete_ticket_validation', {
              p_ticket_code: actualTicketCode,
              p_event_id: validation.eventId,
              p_validator_id: validation.validatedBy,
            });

          if (!error && result?.success) {
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
