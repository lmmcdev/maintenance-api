// src/modules/ticket/ticket.model.ts
import { TicketCategory, TicketPriority, TicketStatus } from '../../shared';
import { PersonModel } from '../person/person.model';
import { AttachmentRef } from '../attachment/attachment.model';
import { BaseDocument } from '../../infra/cosmos.repository';
import crypto from 'crypto';

export interface TicketModel extends BaseDocument {
  title: string | null;
  phoneNumber: string;

  audio: AttachmentRef;
  description: string;

  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;

  attachments?: AttachmentRef[];

  assigneeId?: string | null;
  assignee?: PersonModel | null;

  resolvedAt?: string | null;
}

export const createNewTicket = (
  audio: AttachmentRef,
  description: string,
  phoneNumber: string,
): TicketModel => {
  const now = new Date().toISOString();
  return {
    title: 'New Ticket',
    phoneNumber,
    audio,
    description,
    status: TicketStatus.OPEN,
    priority: TicketPriority.MEDIUM,
    category: TicketCategory.GENERAL,
    attachments: [],
    assigneeId: null,
    assignee: null,
    resolvedAt: null,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
};
