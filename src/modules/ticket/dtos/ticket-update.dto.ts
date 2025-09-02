// src/modules/ticket/ticket.update.dto.ts
import { z } from 'zod';
import { AttachmentRefSchema } from '../../attachment/attachment.dto';
import { PersonRefSchema } from '../../person/person.dto';
import { TicketStatus, TicketPriority, TicketCategory } from '../../../shared';

// Teléfono básico; si quieres E.164, cambia el regex.
const PhoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(30)
  .regex(/^\+?[0-9\s\-().]+$/, 'Teléfono inválido');

export const UpdateTicketDto = z
  .object({
    title: z.string().min(1).optional().nullable(),
    phoneNumber: PhoneSchema.optional(),
    description: z.string().min(1).max(2000).optional(),

    status: z.nativeEnum(TicketStatus).optional(),
    priority: z.nativeEnum(TicketPriority).optional(),
    category: z.nativeEnum(TicketCategory).optional(),

    attachments: z.array(AttachmentRefSchema).optional(),

    assigneeId: z.string().uuid().optional().nullable(),
    assignee: PersonRefSchema.optional().nullable(),

    // timestamps ISO (los setea el server normalmente)
    resolvedAt: z.string().datetime({ offset: true }).nullable().optional(),
    closedAt: z.string().datetime({ offset: true }).nullable().optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    // No permitir ambos a la vez (ajusta si quieres lo contrario)
    if (v.assigneeId && v.assignee) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Usa solo assigneeId o assignee, no ambos.',
        path: ['assignee'],
      });
    }
  });
export type UpdateTicketDto = z.infer<typeof UpdateTicketDto>;
