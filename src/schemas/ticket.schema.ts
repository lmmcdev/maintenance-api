import z from 'zod';
import { TICKET_CATEGORY, TICKET_PRIORITY, TICKET_STATUS } from '../shared';
import { AttachmentRefSchema } from './attachment.schema';
import { PersonRefSchema } from '../modules/person/person.dto';
import { LocationSchema } from './location.schema';

export const TicketCreateSchema = z.object({
  title: z.string().optional().nullable(),
  phoneNumber: z.string().trim().min(7).max(30),
  description: z.string().min(1).max(1000),
  audio: AttachmentRefSchema,

  priority: z.enum(TICKET_PRIORITY).optional(),
  category: z.enum(TICKET_CATEGORY).optional(),

  attachments: z.array(AttachmentRefSchema).optional(),

  locationId: z.uuid().optional().nullable(),
  location: LocationSchema.optional().nullable(),

  assigneeId: z.uuid().optional().nullable(),
  assignee: PersonRefSchema.optional().nullable(),

  reporterId: z.uuid().optional().nullable(),
  reporter: PersonRefSchema.optional().nullable(),

  createdBy: z.string().optional(),
});

export const TicketUpdateSchema = TicketCreateSchema.partial().extend({
  status: z.enum(TICKET_STATUS).optional(),
  resolvedAt: z.iso.datetime().optional().nullable(),
  closedAt: z.iso.datetime().optional().nullable(),
  updatedBy: z.string().optional(),
  ttl: z.number().int().positive().optional(),
});

export const TicketListSchema = z.object({
  q: z.string().min(2).max(100).optional(),
  pageSize: z.number().min(1).max(100).default(10),
  page: z.number().min(1).default(1),
});
