// src/modules/ticket/ticket.model.ts
import { TicketCategory, TicketPriority, TicketStatus } from "../shared";
import { PersonRef } from "./person.model";
import { LocationRef } from "./location.model";
import { AttachmentRef } from "./attachment.model";

export interface TicketDoc {
  id: string;
  title: string;
  phoneNumber?: string | null;
  description?: string | null;

  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;

  transcription?: string | null;
  audio?: AttachmentRef | null;

  attachments?: AttachmentRef[];

  assigneeId?: string | null;
  assignee?: PersonRef | null;

  reporterId?: string | null;
  reporter?: PersonRef | null;

  locationId?: string | null;
  location?: LocationRef | null;

  createdBy?: string;
  updatedBy?: string;

  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  closedAt?: string | null;

  ttl?: number;

  _etag?: string;
  _ts?: number;
}
