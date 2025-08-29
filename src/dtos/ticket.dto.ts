import { v4 as uuid } from 'uuid';
import { TicketCategory, TicketPriority } from '../shared';
import { AttachmentRef } from '../models/attachment.model';
import { PersonRef } from '../models/person.model';
import { TicketDoc } from '../models/ticket.model';
import { LocationRef } from '../models/location.model';

export type TicketCreate = {
  title?: string | null;
  phoneNumber: string;
  description: string; // -> audio transcription
  audio: AttachmentRef;

  priority?: TicketPriority;
  category?: TicketCategory;

  attachments?: AttachmentRef[];

  locationId?: string | null;
  location?: LocationRef | null;

  assigneeId?: string | null;
  assignee?: PersonRef | null;

  reporterId?: string | null;
  reporter?: PersonRef | null;

  createdBy?: string;
};

export type TicketUpdate = Partial<
  Omit<TicketDoc, 'id' | 'createdAt' | 'updatedAt' | '_etag' | '_ts'>
>;

export function newTicket(payload: TicketCreate): TicketDoc {
  const now = new Date().toISOString();
  return {
    id: uuid(),
    title: `Maintenance Ticket: ${payload.title ?? 'Untitled'}`,
    phoneNumber: payload.phoneNumber,
    description: payload.description,

    audio: payload.audio,

    status: 'OPEN',
    priority: payload.priority ?? 'MEDIUM',
    category: payload.category ?? 'OTHER',

    attachments: payload.attachments ?? [],

    locationId: payload.locationId ?? null,
    location: payload.location ?? null,

    assigneeId: payload.assigneeId ?? null,
    assignee: payload.assignee ?? null,
    reporterId: payload.reporterId ?? null,
    reporter: payload.reporter ?? null,

    createdBy: payload.createdBy,
    createdAt: now,
    updatedAt: now,
  };
}

export function applyTicketUpdate(current: TicketDoc, patch: TicketUpdate): TicketDoc {
  const next: TicketDoc = {
    ...current,
    ...patch,

    id: current.id,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  };

  // normalize nullables
  if (patch.phoneNumber === undefined && current.phoneNumber === undefined)
    next.phoneNumber = null as any;
  if (patch.description === undefined && current.description === undefined)
    next.description = null as any;
  if (patch.transcription === undefined && current.transcription === undefined)
    next.transcription = null as any;

  return next;
}
