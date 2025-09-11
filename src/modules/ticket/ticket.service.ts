// src/modules/ticket/ticket.service.ts
import { NotFoundError, TicketStatus } from '../../shared';
import { TicketModel, TicketNote, createTicketNote, addNoteToTicket } from './ticket.model';
import { TicketRepository } from './ticket.repository';

export class TicketService {
  constructor(private ticketRepository: TicketRepository) {}

  async init() {
    await this.ticketRepository.init();
    return this;
  }

  async createTicket(data: Omit<TicketModel, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.ticketRepository.create(data);
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
          cancelledByName
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
    createdByName?: string
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
