import type { AttachmentRef } from '../attachment/attachment.dto';
import type { PersonModel } from '../person/person.model';
import type { LocationRef } from '../location/location.model';
import { TicketStatus, TicketPriority, options } from '../../shared';
import { TicketCategory, SubcategoryName } from './taxonomy.simple';
import {
  TicketSource,
  TicketModel,
  TicketNote,
  createNewTicket,
  createTicketNote,
} from './ticket.model';
import { FileMigrationService } from '../../services/file-migration.service';

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

  static async createFromRingCentralWithMigration(
    audio: AttachmentRef | null,
    description: string,
    fromText: string,
    attachments: AttachmentRef[] = [],
  ): Promise<TicketModel> {
    const ticket = TicketFactory.createFromRingCentral(audio, description, fromText, attachments);

    // Si hay audio o attachments, verificar y migrar los que sean legacy
    if (audio || attachments.length > 0) {
      try {
        const migrationService = new FileMigrationService();
        await migrationService.init();

        // Combinar audio y attachments para migrar todos juntos
        const allAttachments = audio ? [audio, ...attachments] : attachments;

        const migratedAttachments = await migrationService.migrateTicketAttachments(
          ticket.id,
          allAttachments,
          ticket.createdAt.split('T')[0], // Usar fecha de creación del ticket
        );

        ticket.updatedAt = new Date().toISOString();

        // Actualizar audio migrado (primer attachment si había audio original)
        if (audio) {
          ticket.audio = migratedAttachments[0] || null;
        }
      } catch (error) {
        console.error('Error migrating attachments for RingCentral ticket:', error);
        // En caso de error, mantener attachments originales
        console.warn(
          'Keeping original attachments due to migration error - ticket will be created with legacy attachment references',
        );
      }
    }

    return ticket;
  }

  static createFromEmail(
    description: string,
    reporter?: Partial<PersonModel>,
    attachments: AttachmentRef[] = [],
  ): TicketModel {
    const newTicket: TicketModel = {
      id: crypto.randomUUID(),
      title: `${reporter?.firstName} ${reporter?.lastName}`,
      description,
      status: TicketStatus.NEW,
      priority: TicketPriority.MEDIUM,
      category: null,
      subcategory: null,
      reporterId: reporter?.id || '',
      reporter: reporter as PersonModel,
      assigneeIds: [],
      assignees: [],
      locations: [],
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

  /**
   * Crea un ticket desde email con migración automática de attachments legacy
   */
  static async createFromEmailWithMigration(
    description: string,
    reporter?: Partial<PersonModel>,
    attachments: AttachmentRef[] = [],
  ): Promise<TicketModel> {
    const ticket = TicketFactory.createFromEmail(description, reporter, attachments);

    // Si hay attachments, verificar y migrar los que sean legacy
    if (attachments.length > 0) {
      try {
        const migrationService = new FileMigrationService();
        await migrationService.init();

        const migratedAttachments = await migrationService.migrateTicketAttachments(
          ticket.id,
          attachments,
          ticket.createdAt.split('T')[0], // Usar fecha de creación del ticket
        );

        // Actualizar ticket con attachments migrados
        ticket.attachments = migratedAttachments;
        ticket.updatedAt = new Date().toISOString();
      } catch (error) {
        console.error('Error migrating attachments for email ticket:', error);
        // En caso de error, mantener attachments originales
        console.warn(
          'Keeping original attachments due to migration error - ticket will be created with legacy attachment references',
        );
      }
    }

    return ticket;
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
