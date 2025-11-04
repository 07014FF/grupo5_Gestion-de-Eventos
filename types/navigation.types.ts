import { z } from 'zod';

export const eventDetailParamsSchema = z.object({
  eventId: z.string().min(1, 'El identificador del evento es obligatorio'),
  eventTitle: z.string().min(1, 'El título del evento es obligatorio'),
  eventDate: z.string().optional().default(''),
  eventTime: z.string().optional().default(''),
  eventLocation: z.string().optional().default(''),
  ticketPrice: z.string().optional().default('0'),
  eventDescription: z.string().optional().default(''),
  eventCategory: z.string().optional().default(''),
  eventImageUrl: z.string().optional().default(''),
});

export const purchaseParamsSchema = eventDetailParamsSchema
  .pick({
    eventId: true,
    eventTitle: true,
    eventDate: true,
    eventTime: true,
    eventLocation: true,
    ticketPrice: true,
  })
  .extend({
    ticketType: z.string().optional().default('general'),
    quantity: z.string().optional().default('1'),
  });

export type EventDetailParams = z.infer<typeof eventDetailParamsSchema>;
export type PurchaseParams = z.infer<typeof purchaseParamsSchema>;
