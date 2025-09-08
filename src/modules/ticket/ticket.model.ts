// src/modules/ticket/ticket.model.ts
import type { BaseDocument } from '../../infra/cosmos.repository';
import { TicketStatus, TicketPriority } from '../../shared';
import type { AttachmentRef } from '../attachment/attachment.dto';
import type { PersonModel } from '../person/person.model';
import { TicketCategory, SubcategoryName } from './taxonomy.simple';

export interface TicketModel extends BaseDocument {
  id: string;
  title: string;
  phoneNumber?: string;
  description: string;

  // media
  audio: AttachmentRef;
  attachments: AttachmentRef[];

  // estado/prioridad (3 estados)
  status: TicketStatus; // "NEW" | "OPEN" | "DONE"
  priority: TicketPriority; // "LOW" | "MEDIUM" | "HIGH"

  // clasificación simple
  category: TicketCategory; // "PREVENTIVE" | "CORRECTIVE" | "EMERGENCY" | "DEFERRED"
  subcategory: { name: SubcategoryName; displayName: string } | null;

  // asignación
  assigneeIds: string[] | null;
  assignees: PersonModel[] | null;

  // marcas de tiempo derivadas
  resolvedAt: string | null;
  closedAt: string | null;
}

export function createNewTicket(
  audio: AttachmentRef,
  description: string,
  fromText: string,
  opts?: {
    title?: string;
    category?: TicketCategory;
    subcategory?: { name: SubcategoryName; displayName?: string };
    priority?: TicketPriority;
  },
): TicketModel {
  const now = new Date().toISOString();

  // Parse fromText to extract phone and name
  // Supported formats:
  // - "Name, (phone)" e.g., "TAPIA SALVADON, (786) 651-6455"
  // - "phone name phone" e.g., "5638 Esteban Ulloa 5638"
  // - "phone name" e.g., "1234 John Doe"

  let phoneNumber: string | undefined;
  let fullName = fromText.trim();

  // Check for "Name, (phone)" format
  const commaPhoneMatch = fromText.match(/^(.+?),\s*\(?([0-9\s\-\+\(\)]+)\)?$/);
  if (commaPhoneMatch) {
    fullName = commaPhoneMatch[1].trim();
    // Extract just the digits from the phone number
    phoneNumber = commaPhoneMatch[2].replace(/\D/g, '');
  } else {
    // Try other formats with space-separated parts
    const parts = fromText.trim().split(/\s+/);

    if (parts.length >= 3) {
      // Check if first and last parts are the same (likely phone number)
      const firstPart = parts[0];
      const lastPart = parts[parts.length - 1];

      if (firstPart === lastPart && /^\d+$/.test(firstPart)) {
        phoneNumber = firstPart;
        // Extract name (everything between first and last phone number)
        fullName = parts.slice(1, -1).join(' ');
      } else if (/^\d+$/.test(firstPart)) {
        // First part is a number, treat it as phone
        phoneNumber = firstPart;
        fullName = parts.slice(1).join(' ');
      }
    } else if (parts.length > 0 && /^\d+$/.test(parts[0])) {
      // First part is phone number
      phoneNumber = parts[0];
      fullName = parts.slice(1).join(' ') || 'Unknown';
    }
  }

  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,

    title: opts?.title ?? fullName,
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

    assigneeIds: [],
    assignees: [],

    resolvedAt: null,
    closedAt: null,
  };
}
