/**
 * Event Service with Supabase
 * Manages events retrieval, creation, and updates
 */

import { supabase } from '@/lib/supabase';
import { Event } from '@/types/ticket.types';
import { AppError, ErrorCode, Result, Ok, Err, ErrorHandler } from '@/utils/errors';

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export class EventService {
  /**
   * Get all active events
   */
  static async getActiveEvents(): Promise<Result<Event[]>> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'active')
        // Removido filtro de fecha para mostrar TODOS los eventos activos
        .order('date', { ascending: true });

      if (error) {
        throw new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Failed to fetch events',
          'No se pudieron cargar los eventos.',
          error
        );
      }

      if (!data) {
        return Ok([]);
      }

      const events: Event[] = data.map((e) => ({
        id: e.id,
        title: e.title,
        subtitle: e.subtitle || undefined,
        description: e.description || undefined,
        imageUrl: e.image_url || undefined,
        date: e.date,
        time: e.time,
        location: e.location,
        venue: e.venue || undefined,
        price: toNumber(e.price),
        studentPrice: toNumber(e.student_price),
        generalPrice: toNumber(e.general_price, 5),
        availableTickets: toNumber(e.available_tickets, 0),
        category: e.category || undefined,
        rating: e.rating || undefined,
      }));

      return Ok(events);
    } catch (error) {
      ErrorHandler.log(error, 'EventService.getActiveEvents');

      if (error instanceof AppError) {
        return Err(error);
      }

      return Err(
        new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Failed to retrieve events',
          'No se pudieron cargar los eventos.',
          error
        )
      );
    }
  }

  /**
   * Get event by ID
   */
  static async getEventById(eventId: string): Promise<Result<Event>> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error || !data) {
        throw new AppError(
          ErrorCode.UNKNOWN_ERROR,
          `Event ${eventId} not found`,
          'No se encontró el evento.',
          error
        );
      }

      const event: Event = {
        id: data.id,
        title: data.title,
        subtitle: data.subtitle || undefined,
        description: data.description || undefined,
        imageUrl: data.image_url || undefined,
        date: data.date,
        time: data.time,
        location: data.location,
        venue: data.venue || undefined,
        price: toNumber(data.price),
        studentPrice: toNumber(data.student_price),
        generalPrice: toNumber(data.general_price, 5),
        availableTickets: toNumber(data.available_tickets, 0),
        category: data.category || undefined,
        rating: data.rating || undefined,
      };

      return Ok(event);
    } catch (error) {
      ErrorHandler.log(error, 'EventService.getEventById');

      if (error instanceof AppError) {
        return Err(error);
      }

      return Err(
        new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Failed to retrieve event',
          'No se pudo cargar el evento.',
          error
        )
      );
    }
  }

  /**
   * Create a new event (Admin only)
   */
  static async createEvent(
    event: Omit<Event, 'id'>,
    createdBy: string
  ): Promise<Result<Event>> {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          title: event.title,
          subtitle: event.subtitle,
          description: event.description,
          image_url: event.imageUrl,
          date: event.date,
          time: event.time,
          location: event.location,
          venue: event.venue,
          price: event.price,
          student_price: event.studentPrice || 0,
          general_price: event.generalPrice || 5.00,
          available_tickets: event.availableTickets,
          total_tickets: event.availableTickets,
          category: event.category,
          rating: event.rating,
          status: 'active',
          created_by: createdBy,
        })
        .select()
        .single();

      if (error || !data) {
        throw new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Failed to create event',
          'No se pudo crear el evento.',
          error
        );
      }

      const createdEvent: Event = {
        id: data.id,
        title: data.title,
        subtitle: data.subtitle || undefined,
        description: data.description || undefined,
        imageUrl: data.image_url || undefined,
        date: data.date,
        time: data.time,
        location: data.location,
        venue: data.venue || undefined,
        price: toNumber(data.price),
        studentPrice: toNumber(data.student_price),
        generalPrice: toNumber(data.general_price, 5),
        availableTickets: toNumber(data.available_tickets, 0),
        category: data.category || undefined,
        rating: data.rating || undefined,
      };

      return Ok(createdEvent);
    } catch (error) {
      ErrorHandler.log(error, 'EventService.createEvent');

      if (error instanceof AppError) {
        return Err(error);
      }

      return Err(
        new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Failed to create event',
          'No se pudo crear el evento.',
          error
        )
      );
    }
  }

  /**
   * Update an event (Admin only)
   */
  static async updateEvent(
    eventId: string,
    updates: Partial<Event>
  ): Promise<Result<Event>> {
    try {
      const updateData: any = {};

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.subtitle !== undefined) updateData.subtitle = updates.subtitle;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
      if (updates.date !== undefined) updateData.date = updates.date;
      if (updates.time !== undefined) updateData.time = updates.time;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.venue !== undefined) updateData.venue = updates.venue;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.studentPrice !== undefined) updateData.student_price = updates.studentPrice;
      if (updates.generalPrice !== undefined) updateData.general_price = updates.generalPrice;
      if (updates.availableTickets !== undefined) updateData.available_tickets = updates.availableTickets;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.rating !== undefined) updateData.rating = updates.rating;

      const { data, error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', eventId)
        .select()
        .single();

      if (error || !data) {
        throw new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Failed to update event',
          'No se pudo actualizar el evento.',
          error
        );
      }

      const updatedEvent: Event = {
        id: data.id,
        title: data.title,
        subtitle: data.subtitle || undefined,
        description: data.description || undefined,
        imageUrl: data.image_url || undefined,
        date: data.date,
        time: data.time,
        location: data.location,
        venue: data.venue || undefined,
        price: toNumber(data.price),
        studentPrice: toNumber(data.student_price),
        generalPrice: toNumber(data.general_price, 5),
        availableTickets: toNumber(data.available_tickets, 0),
        category: data.category || undefined,
        rating: data.rating || undefined,
      };

      return Ok(updatedEvent);
    } catch (error) {
      ErrorHandler.log(error, 'EventService.updateEvent');

      if (error instanceof AppError) {
        return Err(error);
      }

      return Err(
        new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Failed to update event',
          'No se pudo actualizar el evento.',
          error
        )
      );
    }
  }

  /**
   * Delete an event (Admin only)
   */
  static async deleteEvent(eventId: string): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) {
        throw new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Failed to delete event',
          'No se pudo eliminar el evento.',
          error
        );
      }

      return Ok(undefined);
    } catch (error) {
      ErrorHandler.log(error, 'EventService.deleteEvent');

      if (error instanceof AppError) {
        return Err(error);
      }

      return Err(
        new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Failed to delete event',
          'No se pudo eliminar el evento.',
          error
        )
      );
    }
  }

  /**
   * Search events by category
   */
  static async searchByCategory(category: string): Promise<Result<Event[]>> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'active')
        .eq('category', category)
        // Removido filtro de fecha para mostrar todos los eventos
        .order('date', { ascending: true });

      if (error) {
        throw new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Failed to search events',
          'No se pudieron buscar los eventos.',
          error
        );
      }

      if (!data) {
        return Ok([]);
      }

      const events: Event[] = data.map((e) => ({
        id: e.id,
        title: e.title,
        subtitle: e.subtitle || undefined,
        description: e.description || undefined,
        imageUrl: e.image_url || undefined,
        date: e.date,
        time: e.time,
        location: e.location,
        venue: e.venue || undefined,
        price: toNumber(e.price),
        studentPrice: toNumber(e.student_price),
        generalPrice: toNumber(e.general_price, 5),
        availableTickets: toNumber(e.available_tickets, 0),
        category: e.category || undefined,
        rating: e.rating || undefined,
      }));

      return Ok(events);
    } catch (error) {
      ErrorHandler.log(error, 'EventService.searchByCategory');

      if (error instanceof AppError) {
        return Err(error);
      }

      return Err(
        new AppError(
          ErrorCode.UNKNOWN_ERROR,
          'Failed to search events',
          'No se pudieron buscar los eventos.',
          error
        )
      );
    }
  }
}
