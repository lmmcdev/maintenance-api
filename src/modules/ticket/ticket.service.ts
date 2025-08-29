import type { ListResult } from './ticket.repository';
import { TicketRepository, type TicketDoc } from './ticket.repository';
import {
  type CreateTicketDto,
  type UpdateTicketDto,
  type ListTicketsQuery,
  type TicketStatus,
  toTicketRef,
  type TicketRef,
} from './ticket.dto';

export class NotFoundError extends Error {
  code = 'NOT_FOUND' as const;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class TicketService {
  constructor(private readonly repo: TicketRepository) {}

  async create(dto: CreateTicketDto): Promise<TicketDoc> {
    return this.repo.create(dto);
  }

  async get(id: string): Promise<TicketDoc> {
    const doc = await this.repo.get(id);
    if (!doc) throw new NotFoundError(`Ticket with id ${id} not found`);
    return doc;
  }

  async maybeGet(id: string): Promise<TicketDoc | null> {
    return this.repo.get(id);
  }

  async update(id: string, dto: UpdateTicketDto): Promise<TicketDoc> {
    const updated = await this.repo.update(id, dto);
    if (!updated) throw new NotFoundError(`Ticket with id ${id} not found`);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const exists = await this.repo.get(id);
    if (!exists) throw new NotFoundError(`Ticket with id ${id} not found`);
    return this.repo.delete(id);
  }

  async list(query: ListTicketsQuery): Promise<ListResult<TicketDoc>> {
    return this.repo.list(query);
  }

  async setStatus(id: string, status: TicketStatus): Promise<TicketDoc> {
    // optional: ensure exists for clearer error
    const exists = await this.repo.get(id);
    if (!exists) throw new NotFoundError(`Ticket with id ${id} not found`);
    return this.repo.setStatus(id, status);
  }

  toRef(ticket: TicketDoc): TicketRef {
    return toTicketRef(ticket);
  }
}
