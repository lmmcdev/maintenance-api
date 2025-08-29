import { Container, PatchOperation, SqlParameter, SqlQuerySpec } from '@azure/cosmos';
import { randomUUID } from 'node:crypto';
import {
  AttachmentRef,
  CreateTicketDto,
  CreateTicketSchema,
  ListTicketsQuery,
  ListTicketsSchema,
  TicketDoc as TicketDocDto,
  TicketPriority,
  TicketStatus,
  TicketCategory,
  TicketRef,
  UpdateTicketDto,
  UpdateTicketSchema,
  toTicketRef,
} from './ticket.dto';
import { queryPage } from '../../lib/cosmos-query';
import { PersonRef } from '../person/person.dto';

export type ISODate = string;

/** Persisted document shape (matches TicketDocSchema) */
export interface TicketDoc extends TicketDocDto {
  // keep identical to DTO schema so we can validate with it if desired
}

export interface ListResult<T> {
  items: T[];
  continuationToken?: string;
}

export class TicketRepository {
  constructor(private readonly container: Container) {}

  /** Create a new ticket */
  async create(input: CreateTicketDto): Promise<TicketDoc> {
    const data = CreateTicketSchema.parse(input);
    const now = new Date().toISOString();

    const doc: TicketDoc = {
      id: randomUUID(),
      type: 'ticket',
      title: data.title.trim(),
      phoneNumber: data.phoneNumber.trim(),
      audio: data.audio,
      description: data.description.trim(), // -> audio transcription
      status: data.status ?? 'OPEN',
      priority: data.priority ?? 'MEDIUM',
      category: data.category ?? 'OTHER',

      attachments: data.attachments ?? [],
      assignee: data.assignee,
      reporter: data.reporter,
      createdAt: now,
      updatedAt: now,
    };

    const { resource } = await this.container.items.create<TicketDoc>(doc);
    return resource!;
  }

  /** Get by id (assumes PK=/id; adjust second arg if PK differs) */
  async get(id: string): Promise<TicketDoc | null> {
    const { resource } = await this.container.item(id, id).read<TicketDoc>();
    return resource ?? null;
  }

  /** Partial update via PATCH */
  async update(id: string, patch: UpdateTicketDto): Promise<TicketDoc> {
    const data = UpdateTicketSchema.parse(patch);

    const ops: PatchOperation[] = [];
    if (data.title !== undefined) ops.push({ op: 'set', path: '/title', value: data.title.trim() });
    if (data.phoneNumber !== undefined)
      ops.push({ op: 'set', path: '/phoneNumber', value: data.phoneNumber.trim() });
    if (data.description !== undefined)
      ops.push({ op: 'set', path: '/description', value: data.description.trim() });

    if (data.category !== undefined)
      ops.push({ op: 'set', path: '/category', value: data.category as TicketCategory });
    if (data.priority !== undefined)
      ops.push({ op: 'set', path: '/priority', value: data.priority as TicketPriority });
    if (data.status !== undefined)
      ops.push({ op: 'set', path: '/status', value: data.status as TicketStatus });

    if (data.transcription !== undefined)
      ops.push({ op: 'set', path: '/transcription', value: data.transcription });
    if (data.audio !== undefined)
      ops.push({ op: 'set', path: '/audio', value: data.audio as AttachmentRef });
    if (data.attachments !== undefined)
      ops.push({ op: 'set', path: '/attachments', value: data.attachments as AttachmentRef[] });

    if (data.assignee !== undefined)
      ops.push({ op: 'set', path: '/assignee', value: data.assignee as PersonRef });
    if (data.reporter !== undefined)
      ops.push({ op: 'set', path: '/reporter', value: data.reporter as PersonRef });

    ops.push({ op: 'set', path: '/updatedAt', value: new Date().toISOString() });

    if (ops.length === 1) {
      const current = await this.get(id);
      if (!current) throw new Error(`Ticket ${id} not found`);
      return current;
    }

    const { resource } = await this.container.item(id, id).patch<TicketDoc>(ops);
    if (!resource) {
      const current = await this.get(id);
      if (!current) throw new Error(`Ticket ${id} not found`);
      return current;
    }
    return resource;
  }

  /** Replace entire doc (optional helper) */
  async replace(doc: TicketDoc): Promise<TicketDoc> {
    const next: TicketDoc = { ...doc, updatedAt: new Date().toISOString() };
    const { resource } = await this.container.item(doc.id, doc.id).replace<TicketDoc>(next);
    return resource!;
  }

  /** Delete by id */
  async delete(id: string): Promise<boolean> {
    await this.container.item(id, id).delete();
    return true;
  }

  /** Update only the status (convenience) */
  async setStatus(id: string, status: TicketStatus): Promise<TicketDoc> {
    const { resource } = await this.container.item(id, id).patch<TicketDoc>([
      { op: 'set', path: '/status', value: status },
      { op: 'set', path: '/updatedAt', value: new Date().toISOString() },
    ]);
    if (!resource) {
      const current = await this.get(id);
      if (!current) throw new Error(`Ticket ${id} not found`);
      return current;
    }
    return resource;
  }

  /** List with filters + server-side pagination */
  async list(query: ListTicketsQuery): Promise<ListResult<TicketDoc>> {
    const parsed = ListTicketsSchema.parse(query);
    const {
      q,
      status,
      priority,
      category,
      assigneeId,
      reporterId,
      createdFrom,
      createdTo,
      sortBy = 'createdAt',
      sortDir = 'desc',
      page = 1,
      pageSize = 20,
      ids,
    } = parsed;

    const where: string[] = ["c.type = 'ticket'"];
    const params: SqlParameter[] = [];

    if (q && q.trim()) {
      params.push({ name: '@qlike', value: `%${q.toLowerCase()}%` });
      where.push(
        '(' +
          'LOWER(c.title) LIKE @qlike OR ' +
          'LOWER(c.description) LIKE @qlike OR ' +
          'LOWER(c.phoneNumber) LIKE @qlike OR ' +
          'LOWER(c.assignee.firstName) LIKE @qlike OR ' +
          'LOWER(c.assignee.lastName) LIKE @qlike OR ' +
          'LOWER(c.reporter.firstName) LIKE @qlike OR ' +
          'LOWER(c.reporter.lastName) LIKE @qlike' +
          ')',
      );
    }
    if (status) {
      params.push({ name: '@status', value: status as TicketStatus });
      where.push('c.status = @status');
    }
    if (priority) {
      params.push({ name: '@priority', value: priority as TicketPriority });
      where.push('c.priority = @priority');
    }
    if (category) {
      params.push({ name: '@category', value: category as TicketCategory });
      where.push('c.category = @category');
    }
    if (assigneeId) {
      params.push({ name: '@assigneeId', value: assigneeId });
      where.push('c.assignee.id = @assigneeId');
    }
    if (reporterId) {
      params.push({ name: '@reporterId', value: reporterId });
      where.push('c.reporter.id = @reporterId');
    }
    if (createdFrom) {
      params.push({ name: '@from', value: createdFrom });
      where.push('c.createdAt >= @from');
    }
    if (createdTo) {
      params.push({ name: '@to', value: createdTo });
      where.push('c.createdAt <= @to');
    }
    if (ids?.length) {
      params.push({ name: '@ids', value: ids });
      where.push('ARRAY_CONTAINS(@ids, c.id)');
    }

    const allowedSort = new Set(['createdAt', 'updatedAt', 'priority', 'status']);
    const sortField = allowedSort.has(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortDir === 'asc' ? 'ASC' : 'DESC';

    const sql: SqlQuerySpec = {
      query: `
        SELECT c.id, c.type, c.title, c.phoneNumber, c.description,
               c.status, c.priority, c.category,
               c.transcription, c.audio, c.attachments,
               c.assignee, c.reporter,
               c.createdAt, c.updatedAt
        FROM c
        WHERE ${where.join(' AND ')}
        ORDER BY c.${sortField} ${sortDirection}
      `,
      parameters: params,
    };

    const { items, continuationToken } = await queryPage<TicketDoc>(
      this.container,
      sql,
      page,
      pageSize,
    );

    return { items, continuationToken };
  }

  /** Light mapper for embedding ticket references elsewhere */
  toRef(t: TicketDoc): TicketRef {
    return toTicketRef(t);
  }
}
