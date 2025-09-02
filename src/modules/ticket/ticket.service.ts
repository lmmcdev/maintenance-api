import { NotFoundError } from '../../shared';
import { TicketModel } from './ticket.model';
import { TicketRepository } from './ticket.repository';

export class TicketService {
  private ticketRepository: TicketRepository;

  constructor(ticketRepository: TicketRepository) {
    this.ticketRepository = ticketRepository;
  }

  // Service methods would go here
  async init() {
    await this.ticketRepository.init();
    return this;
  }

  async createTicket(
    data: Omit<TicketModel, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<TicketModel> {
    return this.ticketRepository.create(data);
  }

  async getTicket(id: string): Promise<TicketModel> {
    try {
      const ticket = await this.ticketRepository.get(id);
      if (!ticket) {
        throw new NotFoundError(`Ticket with ID ${id} not found`);
      }
      return ticket;
    } catch (error) {
      console.error('Error fetching ticket:', error);
      throw error;
    }
  }

  async updateTicket(id: string, patch: Partial<TicketModel>): Promise<TicketModel> {
    return this.ticketRepository.update(id, patch);
  }

  async deleteTicket(id: string): Promise<boolean> {
    return this.ticketRepository.delete(id);
  }

  async listTickets(sql: any): Promise<{ items: TicketModel[]; continuationToken?: string }> {
    return this.ticketRepository.list(sql);
  }
}
