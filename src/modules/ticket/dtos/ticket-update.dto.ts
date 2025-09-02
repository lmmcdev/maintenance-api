// src/modules/ticket/dtos/ticket-update.dto.ts
import { z } from 'zod';
import { AttachmentRefSchema } from '../../attachment/attachment.dto';
import { TicketStatus, TicketPriority, PhoneSchema } from '../../../shared';
import { TicketCategory, SimpleSubcategorySchema } from '../taxonomy.simple';

export const UpdateTicketDto = z
  .object({
    title: z.string().min(1).optional(),
    phoneNumber: PhoneSchema.optional(),
    description: z.string().min(1).max(2000).optional(),

    status: z.enum(TicketStatus).optional(),
    priority: z.enum(TicketPriority).optional(),

    category: z.enum(TicketCategory).optional(),
    subcategory: SimpleSubcategorySchema.optional().nullable(),

    attachments: z.array(AttachmentRefSchema).optional(),

    assigneeId: z.uuid().optional().nullable(),

    resolvedAt: z.iso.datetime({ offset: true }).nullable().optional(),
    closedAt: z.iso.datetime({ offset: true }).nullable().optional(),
  })
  .strict();

export type UpdateTicketDto = z.infer<typeof UpdateTicketDto>;
