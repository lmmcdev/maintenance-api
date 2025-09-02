// src/modules/ticket/dtos/ticket-update.dto.ts
import { z } from 'zod';
import { AttachmentRefSchema } from '../../attachment/attachment.dto';
import { TicketStatus, TicketPriority, TicketCategory } from '../../../shared';

// Teléfono básico; si usas E.164, reemplaza el regex por /^\+[1-9]\d{7,14}$/
const PhoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(30)
  .regex(/^\+?[0-9\s\-().]+$/, 'Teléfono inválido');

export const UpdateTicketDto = z
  .object({
    title: z.string().min(1).optional(), // sin null
    phoneNumber: PhoneSchema.optional(),
    description: z.string().min(1).max(2000).optional(),

    status: z.enum(TicketStatus).optional(),
    priority: z.enum(TicketPriority).optional(),
    category: z.enum(TicketCategory).optional(),

    attachments: z.array(AttachmentRefSchema).optional(),

    // 👇 solo assigneeId (uuid o null para desasignar)
    assigneeId: z.string().uuid().optional().nullable(),

    // timestamps (si el cliente los manda; normalmente los computa el server)
    resolvedAt: z.string().datetime({ offset: true }).nullable().optional(),
    closedAt: z.string().datetime({ offset: true }).nullable().optional(),
  })
  .strict();

export type UpdateTicketDto = z.infer<typeof UpdateTicketDto>;
