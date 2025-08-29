// src/repository/ticket.repository.ts

import { Container, SqlQuerySpec } from "@azure/cosmos";
import { getContainer } from "../infra/data-source";
import { TicketDoc } from "../models/ticket.model";

export class TicketRepository {
  private container!: Container;

  async init() {
    this.container = await getContainer({ id: "tickets" });
    return this;
  }

  async getTicket(id: string): Promise<TicketDoc | null> {
    try {
      const { resource: ticket } = await this.container
        .item(id, id)
        .read<TicketDoc>();
      if (!ticket) {
        return null;
      }
      return ticket as TicketDoc;
    } catch (error) {
      console.error("Error getting ticket:", error);
    }
    return null;
  }

  async createTicket(ticket: TicketDoc): Promise<TicketDoc> {
    const { resource: createdTicket } = await this.container.items.create(
      ticket
    );
    if (!createdTicket) {
      throw new Error("Error creating ticket");
    }
    return createdTicket;
  }
}
