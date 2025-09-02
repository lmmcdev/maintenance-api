// src/modules/ticket/ticket.repository.ts
import { CosmosRepository } from '../../infra/cosmos.repository';
import { TicketModel } from './ticket.model';
import { env } from '../../config/env';

export class TicketRepository extends CosmosRepository<TicketModel> {
  constructor() {
    super(env.cosmosDB.ticketContainer, '/id');
  }

  async create(
    doc: Omit<TicketModel, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<TicketModel, 'id'>>,
  ): Promise<TicketModel> {
    return super.create(doc);
  }

  async get(id: string): Promise<TicketModel | null> {
    return super.get(id);
  }
  async update(id: string, patch: Partial<TicketModel>): Promise<TicketModel> {
    return super.update(id, patch);
  }
  async delete(id: string): Promise<boolean> {
    await this.container.item(id, id).delete();
    return true;
  }
  async list(sql: any): Promise<{ items: TicketModel[]; continuationToken?: string }> {
    return super.list(sql);
  }
}
