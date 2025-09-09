// src/modules/ticket/ticket.model.ts
import type { BaseDocument } from '../../infra/cosmos.repository';
import { TicketStatus, TicketPriority } from '../../shared';
import type { AttachmentRef } from '../attachment/attachment.dto';
import type { PersonModel } from '../person/person.model';
import { Department } from '../person/person.model';
import type { LocationRef } from '../location/location.model';
import { TicketCategory, SubcategoryName } from './taxonomy.simple';

export enum TicketSource {
  RINGCENTRAL = 'RINGCENTRAL',
  EMAIL = 'EMAIL',
  WEB = 'WEB',
  OTHER = 'OTHER',
}

// Simple location mock for testing
const LOCATION_MOCK: LocationRef[] = [
  {
    id: 'loc-001',
    name: 'Edificio Central',
    phoneNumbers: ['7866516455', '7865551234', '7865555678'],
    address: '123 Main Street',
    city: 'Miami',
    state: 'FL',
    zip: '33101',
    country: 'USA',
  },
  {
    id: 'loc-002',
    name: 'Oficina Norte',
    phoneNumbers: ['3058795229', '3055551111'],
    address: '456 North Ave',
    city: 'Miami',
    state: 'FL',
    zip: '33102',
    country: 'USA',
  },
  {
    id: 'loc-003',
    name: 'Sucursal Sur',
    phoneNumbers: ['5638', '1234'],
    address: '789 South Blvd',
    city: 'Miami',
    state: 'FL',
    zip: '33103',
    country: 'USA',
  },
  {
    id: 'loc-004',
    name: 'Centro de Mantenimiento',
    phoneNumbers: ['3055559999', '3055558888'],
    address: '321 Service Road',
    city: 'Miami',
    state: 'FL',
    zip: '33104',
    country: 'USA',
  },
];

// Function to find location by phone number
function findLocationByPhone(phoneNumber: string): LocationRef | null {
  const cleanedPhoneNumber = phoneNumber.replace(/\D/g, '');
  return (
    LOCATION_MOCK.find(
      (loc) => loc.phoneNumbers && loc.phoneNumbers.includes(cleanedPhoneNumber),
    ) || null
  );
}

// Function to find location by email domain (simple mock)
function findLocationByEmail(email: string): LocationRef | null {
  // Simple mock: assign location based on email domain
  if (email.includes('@central.com')) return LOCATION_MOCK[0];
  if (email.includes('@norte.com')) return LOCATION_MOCK[1];
  if (email.includes('@sur.com')) return LOCATION_MOCK[2];
  return null;
}

// Simple person mock for testing
const PERSON_MOCK: PersonModel[] = [
  // Maintenance Brigade Personnel
  {
    id: 'person-001',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    firstName: 'Juan',
    lastName: 'Rodriguez',
    phoneNumber: '7866516455',
    email: 'juan.rodriguez@maintenance.com',
    role: 'TECHNICIAN' as any,
    department: Department.MAINTENANCE,
  },
  {
    id: 'person-002',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    firstName: 'Maria',
    lastName: 'Gonzalez',
    phoneNumber: '3058795229',
    email: 'maria.gonzalez@maintenance.com',
    role: 'SUPERVISOR' as any,
    department: Department.MAINTENANCE,
  },
  // Location Personnel
  {
    id: 'person-003',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    firstName: 'Carlos',
    lastName: 'Martinez',
    phoneNumber: '5638',
    email: 'carlos@central.com',
    role: 'SUPERVISOR' as any,
    department: Department.LOCATION,
    locationId: 'loc-001',
  },
  {
    id: 'person-004',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    firstName: 'Ana',
    lastName: 'Lopez',
    phoneNumber: '1234',
    email: 'ana@norte.com',
    role: 'TECHNICIAN' as any,
    department: Department.LOCATION,
    locationId: 'loc-002',
  },
];

// Function to find maintenance brigade personnel by phone
function findBrigadePersonByPhone(phoneNumber: string): PersonModel | null {
  const cleanedPhoneNumber = phoneNumber.replace(/\D/g, '');
  return (
    PERSON_MOCK.find(
      (person) =>
        person.department === Department.MAINTENANCE && person.phoneNumber === cleanedPhoneNumber,
    ) || null
  );
}

// Function to find location personnel by phone
function findLocationPersonByPhone(phoneNumber: string): PersonModel | null {
  const cleanedPhoneNumber = phoneNumber.replace(/\D/g, '');
  return (
    PERSON_MOCK.find(
      (person) =>
        person.department === Department.LOCATION && person.phoneNumber === cleanedPhoneNumber,
    ) || null
  );
}

// Function to find person by email (any department)
function findPersonByEmail(email: string): PersonModel | null {
  return PERSON_MOCK.find((person) => person.email === email) || null;
}

export interface TicketModel extends BaseDocument {
  id: string;
  title: string;
  phoneNumber?: string;
  description: string;

  audio?: AttachmentRef | null;
  attachments: AttachmentRef[];

  status: TicketStatus;
  priority: TicketPriority;

  // clasificación simple
  category: TicketCategory | null; // "PREVENTIVE" | "CORRECTIVE" | "EMERGENCY" | "DEFERRED"
  subcategory: { name: SubcategoryName; displayName: string } | null;

  assigneeIds: string[] | null;
  assignees: PersonModel[] | null;

  reporterId?: string;
  reporter?: PersonModel;

  locationId?: string;
  location?: LocationRef;

  source: TicketSource;

  resolvedAt: string | null;
  closedAt: string | null;
}

export function createNewTicket(
  audio: AttachmentRef | null,
  description: string,
  fromText: string,
  reporter?: Partial<PersonModel>,
  source: TicketSource = TicketSource.OTHER,
  attachments: AttachmentRef[] = [],
  opts?: {
    title?: string;
    category?: TicketCategory;
    subcategory?: { name: SubcategoryName; displayName?: string };
    priority?: TicketPriority;
    reporterId?: string;
    reporter?: PersonModel;
    locationId?: string;
    location?: LocationRef;
  },
): TicketModel {
  const now = new Date().toISOString();

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

    if (parts && parts.length >= 3) {
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
    } else if (parts && parts.length > 0 && /^\d+$/.test(parts[0])) {
      // First part is phone number
      phoneNumber = parts[0];
      fullName = parts.slice(1).join(' ') || 'Unknown';
    }

    // Capitalize full name properly
    if (fullName) {
      fullName = fullName
        .toLowerCase()
        .split(' ')
        .map((n) => n.charAt(0).toUpperCase() + n.slice(1))
        .join(' ');
    }
  }

  // Auto-assign reporter and location based on phone number or email
  let assignedReporter: PersonModel | null = null;
  let assignedLocation: LocationRef | null = null;

  // First try to find person by phone number
  if (phoneNumber) {
    // Check both brigade and location personnel
    assignedReporter =
      findBrigadePersonByPhone(phoneNumber) || findLocationPersonByPhone(phoneNumber);

    // If person is from a location, get their location
    if (assignedReporter?.department === Department.LOCATION && assignedReporter.locationId) {
      assignedLocation =
        LOCATION_MOCK.find((loc) => loc.id === assignedReporter!.locationId) || null;
    }

    // If no person found, try to find location directly by phone
    if (!assignedReporter) {
      assignedLocation = findLocationByPhone(phoneNumber);
    }
  }

  // If no reporter found by phone and email is provided, try email
  if (!assignedReporter && reporter?.email) {
    assignedReporter = findPersonByEmail(reporter.email);

    // If person is from a location, get their location
    if (assignedReporter?.department === Department.LOCATION && assignedReporter.locationId) {
      assignedLocation =
        LOCATION_MOCK.find((loc) => loc.id === assignedReporter!.locationId) || null;
    }
  }

  // If still no location and email provided, try location by email domain
  if (!assignedLocation && reporter?.email) {
    assignedLocation = findLocationByEmail(reporter.email);
  }

  // Use provided values if available, otherwise use found values
  const finalReporter = opts?.reporter || assignedReporter || undefined;
  const finalLocation = opts?.location || assignedLocation || undefined;

  if (finalReporter) {
    fullName = `${finalReporter.firstName} ${finalReporter.lastName}`;
    if (finalReporter.phoneNumber) {
      phoneNumber = finalReporter.phoneNumber;
    }
  }

  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,

    title: fullName || 'Unknown',
    phoneNumber,
    description,

    audio: audio || null,
    attachments,

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

    reporterId: opts?.reporterId || finalReporter?.id,
    reporter: finalReporter,

    locationId: opts?.locationId || finalLocation?.id,
    location: finalLocation,

    source,

    resolvedAt: null,
    closedAt: null,
  };
}
