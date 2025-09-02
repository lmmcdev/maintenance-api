// src/modules/ticket/ticket.model.ts
import type { BaseDocument } from '../../infra/cosmos.repository';
import { TicketStatus, TicketPriority } from '../../shared';
import type { AttachmentRef } from '../attachment/attachment.dto';
import type { PersonModel } from '../person/person.model';
import { TicketCategory, SubcategoryName } from './taxonomy.simple';

export interface TicketModel extends BaseDocument {
  id: string;
  title: string;
  phoneNumber: string;
  description: string;

  // media
  audio: AttachmentRef;
  attachments: AttachmentRef[];

  // estado/prioridad (3 estados)
  status: TicketStatus; // "NEW" | "IN_PROGRESS" | "DONE"
  priority: TicketPriority; // "LOW" | "MEDIUM" | "HIGH"

  // clasificación simple
  category: TicketCategory; // "PREVENTIVE" | "CORRECTIVE" | "EMERGENCY" | "DEFERRED"
  subcategory: { name: SubcategoryName; displayName: string } | null;

  // asignación
  assigneeId: string | null;
  assignee: PersonModel | null;

  // marcas de tiempo derivadas
  resolvedAt: string | null;
  closedAt: string | null;
}

export function createNewTicket(
  audio: AttachmentRef,
  description: string,
  phoneNumber: string,
  opts?: {
    title?: string;
    category?: TicketCategory;
    subcategory?: { name: SubcategoryName; displayName?: string };
    priority?: TicketPriority;
  },
): TicketModel {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,

    title: opts?.title ?? 'New Ticket',
    phoneNumber,
    description,

    audio,
    attachments: [],

    status: TicketStatus.NEW,
    priority: opts?.priority ?? TicketPriority.MEDIUM,

    category: opts?.category ?? TicketCategory.CORRECTIVE,
    subcategory: opts?.subcategory
      ? {
          name: opts.subcategory.name,
          displayName: opts.subcategory.displayName ?? opts.subcategory.name,
        }
      : null,

    assigneeId: null,
    assignee: null,

    resolvedAt: null,
    closedAt: null,
  };
}
