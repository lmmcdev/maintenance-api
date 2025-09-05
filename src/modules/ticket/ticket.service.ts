// src/modules/ticket/ticket.service.ts
import { NotFoundError, TicketStatus } from '../../shared';
import { TicketModel } from './ticket.model';
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

  async assignTicket(id: string, assigneeId: string) {
    return this.ticketRepository.update(id, {
      assigneeIds: [assigneeId],
      updatedAt: new Date().toISOString(),
    });
  }

  async deleteAllTickets(): Promise<number> {
    return this.ticketRepository.deleteAll();
  }
}
