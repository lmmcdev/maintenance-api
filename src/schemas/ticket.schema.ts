import z from "zod";
import { TICKET_CATEGORY, TICKET_PRIORITY, TICKET_STATUS } from "../shared";
import { AttachmentRefSchema } from "./attachment.schema";
import { PersonRefSchema } from "./person.schema";
import { LocationSchema } from "./location.schema";

export const TicketCreateSchema = z.object({
  title: z.string().min(1),
  phoneNumber: z.string().trim().min(7).max(30).optional().nullable(),
  description: z.string().optional().nullable(),

  priority: z.enum(TICKET_PRIORITY).default("MEDIUM"),
  category: z.enum(TICKET_CATEGORY),

  transcription: z.string().optional().nullable(),
  audio: AttachmentRefSchema.optional().nullable(),
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
