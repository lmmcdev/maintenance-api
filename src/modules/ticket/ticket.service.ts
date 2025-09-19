// src/modules/ticket/ticket.service.ts
import { NotFoundError, TicketStatus } from '../../shared';
import {
  TicketModel,
  TicketNote,
  createTicketNote,
  addNoteToTicket,
  TicketSource,
} from './ticket.model';
import { TicketFactory } from './ticket.factory';
import { TicketRepository } from './ticket.repository';
import { AttachmentRef } from '../attachment/attachment.dto';
import { PersonModel } from '../person/person.model';
import { LocationRef } from '../location/location.model';
import { TicketPriority } from '../../shared';
import { TicketCategory, SubcategoryName } from './taxonomy.simple';
import { EmailNotificationService } from '../../services/email-notification.service';

export class TicketService {
  private emailNotificationService: EmailNotificationService = new EmailNotificationService();
  constructor(private ticketRepository: TicketRepository) {}

  async init() {
    await this.ticketRepository.init();
    return this;
  }

  async createTicket(data: Omit<TicketModel, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.ticketRepository.create(data);
  }

  async createFromSource(
    source: TicketSource,
    description: string,
    options?: {
      audio?: AttachmentRef | null;
      fromText?: string;
      reporter?: Partial<PersonModel>;
      attachments?: AttachmentRef[];
    },
  ) {
    let ticket: TicketModel;

    const { audio = null, fromText = '', reporter, attachments = [] } = options || {};

    switch (source) {
      case TicketSource.RINGCENTRAL:
        // Usar la función con migración automática para RingCentral
        ticket = await TicketFactory.createFromRingCentralWithMigration(
          audio,
          description,
          fromText,
          attachments,
        );
        break;
      case TicketSource.EMAIL:
        // Usar la función con migración automática para emails
        ticket = await TicketFactory.createFromEmailWithMigration(
          description,
          reporter,
          attachments,
        );
        this.emailNotificationService.sendEmail({
          to_user: reporter?.email || '',
          email_subject: 'New Ticket Created',
          email_body: `A new ticket has been created: ${ticket.id}`,
        });
        break;
      case TicketSource.WEB:
        ticket = TicketFactory.createFromWeb('Web Ticket', description, undefined, undefined, {
          attachments,
        });
        break;
      default:
        ticket = await TicketFactory.createFromEmailWithMigration(
          description,
          reporter,
          attachments,
        );
    }

    return this.ticketRepository.create(ticket);
  }

  async createEmergency(
    title: string,
    description: string,
    location: LocationRef,
    reporter?: PersonModel,
    attachments: AttachmentRef[] = [],
  ) {
    const ticket = TicketFactory.createEmergency(
      title,
      description,
      location,
      reporter,
      attachments,
    );
    return this.ticketRepository.create(ticket);
  }

  async createPreventiveMaintenance(
    title: string,
    description: string,
    assignees: PersonModel[],
    location?: LocationRef,
    options?: {
      priority?: TicketPriority;
      subcategory?: { name: SubcategoryName; displayName?: string };
      attachments?: AttachmentRef[];
    },
  ) {
    const ticket = TicketFactory.createPreventive(title, description, assignees, location, options);
    return this.ticketRepository.create(ticket);
  }

  async createCorrectiveMaintenance(
    title: string,
    description: string,
    reporter: PersonModel,
    location: LocationRef,
    options?: {
      priority?: TicketPriority;
      subcategory?: { name: SubcategoryName; displayName?: string };
      attachments?: AttachmentRef[];
    },
  ) {
    const ticket = TicketFactory.createCorrective(title, description, reporter, location, options);
    return this.ticketRepository.create(ticket);
  }

  async createFromTemplate(
    templateType: 'maintenance' | 'inspection' | 'repair',
    overrides: Partial<TicketModel> & { title?: string; description?: string },
  ) {
    const template = TicketFactory.createTemplate(templateType);
    const ticket = TicketFactory.createFromEmail(
      overrides.description || template.description!,
      overrides.reporter,
      overrides.attachments || [],
    );
    return this.ticketRepository.create(ticket);
  }

  async cloneTicket(ticketId: string, overrides?: Partial<TicketModel>) {
    const originalTicket = await this.getById(ticketId);
    if (!originalTicket) {
      throw new NotFoundError(`Ticket with ID ${ticketId} not found`);
    }

    const clonedTicket = TicketFactory.clone(originalTicket, overrides);
    return this.ticketRepository.create(clonedTicket);
  }

  async getTicket(id: string) {
    const t = await this.ticketRepository.get(id);
    if (!t) throw new NotFoundError(`Ticket with ID ${id} not found`);
    return t;
  }

  async getById(id: string) {
    return this.ticketRepository.get(id);
  }

  async updateTicket(id: string, patch: Partial<TicketModel>) {
    return this.ticketRepository.update(id, patch);
  }

  async deleteTicket(id: string) {
    return this.ticketRepository.delete(id);
  }

  async listTickets(sql: any) {
    return this.ticketRepository.list(sql);
  }

  // --- helpers de estado ---
  private patchForStatus(status: TicketStatus): Partial<TicketModel> {
    const now = new Date().toISOString();
    const p: Partial<TicketModel> = { status, updatedAt: now };
    if (status === TicketStatus.DONE) {
      p.resolvedAt = p.resolvedAt ?? now;
    } else {
      p.resolvedAt = null;
    }
    return p;
  }

  async closeTicket(id: string) {
    // “cerrar” = DONE
    return this.ticketRepository.update(id, this.patchForStatus(TicketStatus.DONE));
  }

  async reopenTicket(id: string) {
    return this.ticketRepository.update(id, this.patchForStatus(TicketStatus.NEW));
  }

  async inProgressTicket(id: string) {
    return this.ticketRepository.update(id, this.patchForStatus(TicketStatus.OPEN));
  }

  async cancelTicket(id: string, reason?: string, cancelledBy?: string, cancelledByName?: string) {
    const patch = this.patchForStatus(TicketStatus.CANCELLED);

    // Si se proporciona una razón, agregar una nota de cancelación
    if (reason) {
      const ticket = await this.getById(id);
      if (ticket) {
        const updatedTicket = addNoteToTicket(
          ticket,
          reason,
          'cancellation',
          cancelledBy,
          cancelledByName,
        );
        patch.notes = updatedTicket.notes;
      }
    }

    return this.ticketRepository.update(id, patch);
  }

  async assignTicket(id: string, assigneeId: string) {
    return this.ticketRepository.update(id, {
      assigneeIds: [assigneeId],
      updatedAt: new Date().toISOString(),
    });
  }

  async deleteAllTickets(): Promise<number> {
    return this.ticketRepository.deleteAll();
  }

  // --- métodos para notas ---
  async addNoteToTicket(
    id: string,
    content: string,
    type: TicketNote['type'] = 'general',
    createdBy?: string,
    createdByName?: string,
  ): Promise<TicketModel> {
    const ticket = await this.getById(id);
    if (!ticket) {
      throw new NotFoundError(`Ticket with ID ${id} not found`);
    }

    const updatedTicket = addNoteToTicket(ticket, content, type, createdBy, createdByName);
    return this.ticketRepository.update(id, {
      notes: updatedTicket.notes,
      updatedAt: updatedTicket.updatedAt,
    });
  }

  async getTicketNotes(id: string): Promise<TicketNote[]> {
    const ticket = await this.getById(id);
    if (!ticket) {
      throw new NotFoundError(`Ticket with ID ${id} not found`);
    }
    // Asegurar compatibilidad con tickets existentes que no tengan notes
    return Array.isArray(ticket.notes) ? ticket.notes : [];
  }
}
