import { z } from 'zod';
import { AttachmentRefSchema } from '../../attachment/attachment.dto';
import { PersonCreateDto } from '../../person/dtos/person-create.dto';
import { TicketStatus, TicketPriority, PhoneSchema } from '../../../shared';
import { TicketCategory, SimpleSubcategorySchema } from '../taxonomy.simple';
import { TicketSource } from '../ticket.model';

export const CreateTicketDto = z
  .object({
    title: z.string().min(1).optional().nullable(),
    fromText: z.string().min(1).max(100).optional().nullable(),
    description: z.string().min(1).max(1000),
    audio: AttachmentRefSchema.optional().nullable(),
    reporter: z
      .object({
        firstName: z.string().min(1).max(100).optional().nullable(),
        lastName: z.string().min(1).max(100).optional().nullable(),
        phoneNumber: PhoneSchema.optional().nullable(),
        email: z.email().max(100).optional().nullable(),
      })
      .optional(),
    source: z.enum(TicketSource).optional(),

    status: z.enum(TicketStatus).optional(),
    priority: z.enum(TicketPriority).optional(),
    category: z.enum(TicketCategory).optional(),
    subcategory: SimpleSubcategorySchema.optional().nullable(),

    attachmentsString: z.string().optional().nullable(),

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
    // Remove any transformation related to attachments since we're using attachmentsString
    return v;
  });

export type CreateTicketDto = z.infer<typeof CreateTicketDto>;
