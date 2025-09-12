import type { AttachmentRef } from '../attachment/attachment.dto';
import { Department, type PersonModel } from '../person/person.model';
import type { LocationRef } from '../location/location.model';
import { TicketStatus, TicketPriority, options, PersonRole } from '../../shared';
import { TicketCategory, SubcategoryName } from './taxonomy.simple';
import {
  TicketSource,
  TicketModel,
  TicketNote,
  createNewTicket,
  createTicketNote,
} from './ticket.model';
import { PersonService } from '../person/person.service';
import { PersonRepository } from '../person/person.repository';

export class TicketFactory {
  static createFromRingCentral(
    audio: AttachmentRef | null,
    description: string,
    fromText: string,
    attachments: AttachmentRef[] = [],
  ): TicketModel {
    return createNewTicket(
      audio,
      description,
      fromText,
      undefined,
      TicketSource.RINGCENTRAL,
      attachments,
    );
  }

  static async createFromEmail(
    description: string,
    reporter?: Partial<PersonModel>,
    attachments: AttachmentRef[] = [],
  ): Promise<TicketModel> {
    let foundReporter: PersonModel | null = null;
    const email = reporter?.email?.toLowerCase();
    const personService = new PersonService(new PersonRepository());
    if (email) {
      await personService.init();

      foundReporter = await personService.findByEmail(email);
    }
    if (!foundReporter) {
      foundReporter = await personService.createPerson({
        firstName: reporter?.firstName ?? 'Guest',
        lastName: reporter?.lastName ?? 'User',
        email: email ?? undefined,
        phoneNumber: reporter?.phoneNumber ?? undefined,
        location: reporter?.location ?? undefined,
        role: PersonRole.USER,
        department: Department.GENERAL,
      });
    }

    const newTicket: TicketModel = {
      id: crypto.randomUUID(),
      title: `${foundReporter?.firstName} ${foundReporter?.lastName}`,
      description,
      status: TicketStatus.NEW,
      priority: TicketPriority.MEDIUM,
      category: null,
      subcategory: null,
      reporterId: foundReporter?.id || '',
      reporter: foundReporter as PersonModel,
      assigneeIds: [],
      assignees: [],
      locationId: foundReporter?.locationId || undefined,
      location: foundReporter?.location || undefined,
      source: TicketSource.EMAIL,
      attachments,
      notes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: null,
      closedAt: null,
    };
    return newTicket;
  }

  static createFromWeb(
    title: string,
    description: string,
    reporter?: PersonModel,
    location?: LocationRef,
    options?: {
      priority?: TicketPriority;
      category?: TicketCategory;
      subcategory?: { name: SubcategoryName; displayName?: string };
      attachments?: AttachmentRef[];
    },
  ): TicketModel {
    return createNewTicket(
      null,
      description,
      undefined,
      reporter,
      TicketSource.WEB,
      options?.attachments || [],
      {
        title,
        reporter,
        location,
        priority: options?.priority,
        category: options?.category,
        subcategory: options?.subcategory,
      },
    );
  }

  static createEmergency(
    title: string,
    description: string,
    location: LocationRef,
    reporter?: PersonModel,
    attachments: AttachmentRef[] = [],
  ): TicketModel {
    return createNewTicket(
      null,
      description,
      undefined,
      reporter,
      TicketSource.OTHER,
      attachments,
      {
        title,
        priority: TicketPriority.HIGH,
        category: TicketCategory.EMERGENCY,
        reporter,
        location,
      },
    );
  }

  static createPreventive(
    title: string,
    description: string,
    assignees: PersonModel[],
    location?: LocationRef,
    options?: {
      priority?: TicketPriority;
      subcategory?: { name: SubcategoryName; displayName?: string };
      attachments?: AttachmentRef[];
    },
  ): TicketModel {
    const ticket = createNewTicket(
      null,
      description,
      undefined,
      undefined,
      TicketSource.OTHER,
      options?.attachments || [],
      {
        title,
        priority: options?.priority || TicketPriority.MEDIUM,
        category: TicketCategory.PREVENTIVE,
        subcategory: options?.subcategory,
        location,
      },
    );

    return {
      ...ticket,
      assigneeIds: assignees.map((a) => a.id),
      assignees,
    };
  }

  static createCorrective(
    title: string,
    description: string,
    reporter: PersonModel,
    location: LocationRef,
    options?: {
      priority?: TicketPriority;
      subcategory?: { name: SubcategoryName; displayName?: string };
      attachments?: AttachmentRef[];
    },
  ): TicketModel {
    return createNewTicket(
      null,
      description,
      undefined,
      reporter,
      TicketSource.OTHER,
      options?.attachments || [],
      {
        title,
        priority: options?.priority || TicketPriority.MEDIUM,
        category: TicketCategory.CORRECTIVE,
        subcategory: options?.subcategory,
        reporter,
        location,
      },
    );
  }

  static createWithNote(
    baseTicket: Partial<TicketModel> & { title: string; description: string },
    noteContent: string,
    noteType: TicketNote['type'] = 'general',
    createdBy?: string,
    createdByName?: string,
  ): TicketModel {
    const ticket = createNewTicket(
      null,
      baseTicket.description,
      undefined,
      baseTicket.reporter,
      baseTicket.source || TicketSource.OTHER,
      baseTicket.attachments || [],
      {
        title: baseTicket.title,
        priority: baseTicket.priority,
        category: baseTicket.category || undefined,
        subcategory: baseTicket.subcategory || undefined,
        reporter: baseTicket.reporter,
        location: baseTicket.location,
      },
    );

    const note = createTicketNote(noteContent, noteType, createdBy, createdByName);
    return {
      ...ticket,
      notes: [note],
    };
  }

  static createTemplate(
    templateType: 'maintenance' | 'inspection' | 'repair',
  ): Partial<TicketModel> {
    const templates = {
      maintenance: {
        category: TicketCategory.PREVENTIVE,
        priority: TicketPriority.MEDIUM,
        title: 'Maintenance Task',
        description: 'Scheduled maintenance task',
      },
      inspection: {
        category: TicketCategory.PREVENTIVE,
        priority: TicketPriority.LOW,
        title: 'Inspection',
        description: 'Routine inspection task',
      },
      repair: {
        category: TicketCategory.CORRECTIVE,
        priority: TicketPriority.HIGH,
        title: 'Repair Task',
        description: 'Equipment repair required',
      },
    };

    return templates[templateType];
  }

  static clone(ticket: TicketModel, overrides?: Partial<TicketModel>): TicketModel {
    const now = new Date().toISOString();
    return {
      ...ticket,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      status: TicketStatus.NEW,
      resolvedAt: null,
      closedAt: null,
      notes: [],
      ...overrides,
    };
  }
}
