import { z } from 'zod';
import { AttachmentRefSchema } from '../../attachment/attachment.dto';
import { PersonCreateDto } from '../../person/dtos/person-create.dto';
import { TicketStatus, TicketPriority, PhoneSchema } from '../../../shared';
import { TicketCategory, SimpleSubcategorySchema } from '../taxonomy.simple';

export const CreateTicketDto = z
  .object({
    title: z.string().min(1).optional().nullable(),
    fromText: z.string().min(1).max(100).optional().nullable(),
    description: z.string().min(1).max(1000),
    audio: AttachmentRefSchema,

    status: z.enum(TicketStatus).optional(),
    priority: z.enum(TicketPriority).optional(),
    category: z.enum(TicketCategory).optional(),
    subcategory: SimpleSubcategorySchema.optional().nullable(),

    attachments: z.array(AttachmentRefSchema).optional().default([]),

    assigneeId: z.uuid().optional().nullable(),
    assignee: PersonCreateDto.optional().nullable(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.assigneeId && v.assignee) {
      ctx.addIssue({
        code: 'custom',
        message: 'Usa solo assigneeId o assignee, no ambos.',
        path: ['assignee'],
      });
    }
  })
  .transform((v) => {
    const seen = new Set<string>();
    const attachments = (v.attachments ?? []).filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
    return { ...v, attachments };
  });

export type CreateTicketDto = z.infer<typeof CreateTicketDto>;
