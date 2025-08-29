// src/modules/ticket/ticket.dto.ts
import { z } from 'zod';
import { PersonRefSchema } from '../person/person.dto';

// ---- Enums ----
export const TicketStatusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);
export type TicketStatus = z.infer<typeof TicketStatusEnum>;

export const TicketPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export type TicketPriority = z.infer<typeof TicketPriorityEnum>;

export const TicketCategoryEnum = z.enum(['PREVENTIVE', 'CORRECTIVE', 'EMERGENCY', 'OTHER']);
export type TicketCategory = z.infer<typeof TicketCategoryEnum>;

// ---- Shared sub-schemas (local, lightweight) ----
export const AttachmentRefSchema = z.object({
  id: z.uuid(),
  filename: z.string().min(1),
  mimetype: z.string().min(1),
  size: z.number().int().nonnegative().optional(),
  url: z.url().optional(),
});
export type AttachmentRef = z.infer<typeof AttachmentRefSchema>;

// Optional: a compact Ticket reference for embedding elsewhere
export const TicketRefSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1),
  status: TicketStatusEnum,
  priority: TicketPriorityEnum,
});
export type TicketRef = z.infer<typeof TicketRefSchema>;

// ---- Create (POST /tickets) ----
export const CreateTicketSchema = z.object({
  title: z.string().trim().min(1, 'title is required'),
  phoneNumber: z
    .string()
    .trim()
    // Permissive dial string; adjust if you want strict E.164
    .regex(/^[+0-9()\-.\s]{7,20}$/, 'invalid phone number'),
  description: z.string().trim().min(1, 'description is required'),

  category: TicketCategoryEnum.default('OTHER').optional(),
  priority: TicketPriorityEnum.default('MEDIUM').optional(),
  // Let server default status to OPEN if omitted
  status: TicketStatusEnum.default('OPEN').optional(),

  transcription: z.string().optional(),
  // Either keep a single audio attachment reference…
  audio: AttachmentRefSchema.optional(),
  // …and/or a list of attachments
  attachments: z.array(AttachmentRefSchema).default([]),

  assignee: PersonRefSchema.optional(),
  reporter: PersonRefSchema.optional(),
});
export type CreateTicketDto = z.infer<typeof CreateTicketSchema>;

// ---- Update (PATCH /tickets/:id) ----
// Partial, but keep enums validated and strings trimmed when present.
export const UpdateTicketSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    phoneNumber: z
      .string()
      .trim()
      .regex(/^[+0-9()\-.\s]{7,20}$/, 'invalid phone number')
      .optional(),
    description: z.string().trim().min(1).optional(),

    category: TicketCategoryEnum.optional(),
    priority: TicketPriorityEnum.optional(),
    status: TicketStatusEnum.optional(),

    transcription: z.string().optional(),
    audio: AttachmentRefSchema.optional(),
    attachments: z.array(AttachmentRefSchema).optional(),

    assignee: PersonRefSchema.optional(),
    reporter: PersonRefSchema.optional(),
  })
  .strict();
export type UpdateTicketDto = z.infer<typeof UpdateTicketSchema>;

// ---- Params & Query DTOs ----
export const TicketIdParamSchema = z.object({
  id: z.uuid(),
});
export type TicketIdParam = z.infer<typeof TicketIdParamSchema>;

export const ListTicketsSchema = z.object({
  q: z.string().trim().optional(), // free-text (title/description/phone/email)
  status: TicketStatusEnum.optional(),
  priority: TicketPriorityEnum.optional(),
  category: TicketCategoryEnum.optional(),

  assigneeId: z.uuid().optional(),
  reporterId: z.uuid().optional(),

  createdFrom: z.iso.datetime().optional(), // ISO-8601
  createdTo: z.iso.datetime().optional(), // ISO-8601

  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'status']).default('createdAt').optional(),
  sortDir: z.enum(['asc', 'desc']).default('desc').optional(),

  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),

  ids: z.array(z.uuid()).optional(),
});
export type ListTicketsQuery = z.infer<typeof ListTicketsSchema>;

// ---- (Optional) Full Ticket Doc Schema (server side shape) ----
// Useful if you want runtime validation after reads/writes.
export const TicketDocSchema = z.object({
  id: z.uuid(),
  type: z.literal('ticket'),
  title: z.string(),
  phoneNumber: z.string(),
  description: z.string(),
  status: TicketStatusEnum,
  priority: TicketPriorityEnum,
  category: TicketCategoryEnum,
  transcription: z.string().optional(),
  audio: AttachmentRefSchema.optional(),
  attachments: z.array(AttachmentRefSchema).default([]),
  assignee: PersonRefSchema.optional(),
  reporter: PersonRefSchema.optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type TicketDoc = z.infer<typeof TicketDocSchema>;

// Helper to map a full Ticket doc to a compact reference
export const toTicketRef = (
  t: Pick<TicketDoc, 'id' | 'title' | 'status' | 'priority'>,
): TicketRef => ({
  id: t.id,
  title: t.title,
  status: t.status,
  priority: t.priority,
});
