// src/services/ticket.service.ts

import { TicketCreate, TicketUpdate, newTicket } from "../dtos/ticket.dto";
import { TicketDoc } from "../models/ticket.model";
import { TicketRepository } from "../repository/ticket.repository";
import { NotFoundError } from "../shared";

export class TicketService {
  constructor(private readonly ticketRepo: TicketRepository) {}

  static async createInstance(): Promise<TicketService> {
    const ticketRepo = new TicketRepository();
    await ticketRepo.init();
    return new TicketService(ticketRepo);
  }

  async getTicket(id: string): Promise<TicketDoc | null> {
    const ticket = await this.ticketRepo.getTicket(id);
    if (!ticket) {
      throw new NotFoundError(`Ticket with id ${id} not found`);
    }
    return ticket;
  }

  async createTicket(data: TicketCreate): Promise<TicketDoc> {
    const ticket = newTicket(data);
    const createdTicket = await this.ticketRepo.createTicket(ticket);
    return createdTicket;
  }
}
