// src/modules/ticket/ticket.model.ts
import type { BaseDocument } from '../../infra/cosmos.repository';
import { TicketStatus, TicketPriority } from '../../shared';
import type { AttachmentRef } from '../attachment/attachment.dto';
import type { PersonModel } from '../person/person.model';
import { TicketCategory, SubcategoryName } from './taxonomy.simple';

export interface TicketNote {
  id: string;
  content: string;
  type: 'general' | 'cancellation' | 'status_change' | 'assignment' | 'resolution';
  createdAt: string;
  createdBy?: string; // ID del usuario que creó la nota
  createdByName?: string; // Nombre del usuario para referencia
}

export interface TicketModel extends BaseDocument {
  id: string;
  title: string;
  phoneNumber?: string;
  description: string;

  // notas y observaciones (opcional para compatibilidad con tickets existentes)
  notes?: TicketNote[];

  // media
  audio: AttachmentRef;
  attachments: AttachmentRef[];

  // estado/prioridad (3 estados)
  status: TicketStatus; // "NEW" | "OPEN" | "DONE"
  priority: TicketPriority; // "LOW" | "MEDIUM" | "HIGH"

  // clasificación simple
  category: TicketCategory | null; // "PREVENTIVE" | "CORRECTIVE" | "EMERGENCY" | "DEFERRED"
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
  // - "Name (phone)" e.g., "WIRELESS CALLER (305) 879-5229"
  // - "Name (phone)" e.g., "Pita Sanchez Pa (305) 244-4475"
  // - "phone name phone" e.g., "5638 Esteban Ulloa 5638"
  // - "phone name" e.g., "1234 John Doe"

  let phoneNumber: string | undefined;
  let fullName = fromText.trim();

  // Check for phone number in format "(XXX) XXX-XXXX" at the end
  // This regex handles: "Name (305) 244-4475" or "Name, (786) 651-6455"
  const phoneMatch = fromText.match(/^(.+?),?\s*\((\d{3})\)\s*([\d\-]+)$/);
  if (phoneMatch) {
    fullName = phoneMatch[1].trim();
    // Remove trailing comma if present
    if (fullName.endsWith(',')) {
      fullName = fullName.slice(0, -1).trim();
    }
    // Combine area code with rest of number, removing non-digits
    const areaCode = phoneMatch[2];
    const restOfPhone = phoneMatch[3].replace(/\D/g, '');
    phoneNumber = areaCode + restOfPhone;

    // Capitalize full name properly
    fullName = fullName
      .toLowerCase()
      .split(' ')
      .map((n) => n.charAt(0).toUpperCase() + n.slice(1))
      .join(' ');
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

    // Capitalize full name properly
    fullName = fullName
      .toLowerCase()
      .split(' ')
      .map((n) => n.charAt(0).toUpperCase() + n.slice(1))
      .join(' ');
  }

  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,

    title: fullName,
    phoneNumber,
    description,

    // inicializar array de notas vacío
    notes: [],

    audio,
    attachments: [],

    status: TicketStatus.NEW,
    priority: opts?.priority ?? TicketPriority.MEDIUM,

    category: opts?.category ?? null,
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

export function createTicketNote(
  content: string,
  type: TicketNote['type'] = 'general',
  createdBy?: string,
  createdByName?: string
): TicketNote {
  return {
    id: crypto.randomUUID(),
    content,
    type,
    createdAt: new Date().toISOString(),
    createdBy,
    createdByName,
  };
}

export function addNoteToTicket(
  ticket: TicketModel,
  content: string,
  type: TicketNote['type'] = 'general',
  createdBy?: string,
  createdByName?: string
): TicketModel {
  const note = createTicketNote(content, type, createdBy, createdByName);
  // Asegurar que notes existe como array, para compatibilidad con tickets existentes
  const existingNotes = Array.isArray(ticket.notes) ? ticket.notes : [];
  return {
    ...ticket,
    notes: [...existingNotes, note],
    updatedAt: new Date().toISOString(),
  };
}
