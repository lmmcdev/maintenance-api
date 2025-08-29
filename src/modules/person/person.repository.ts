// src/modules/people/people.repository.ts
import { Container, PatchOperation, SqlParameter, SqlQuerySpec } from '@azure/cosmos';
import { randomUUID } from 'node:crypto';
import {
  CreatePersonSchema,
  UpdatePersonSchema,
  ListPersonSchema,
  type Role,
  type CreatePersonDto,
  type UpdatePersonDto,
  type ListPeopleQuery,
} from './person.dto';
import { queryPage } from '../../lib/cosmos-query';
import { getContainer } from '../../infra/data-source';

const CONTAINER_ID = 'persons';
const PK_PATH = '/id';

export type ISODate = string;

export interface PersonDoc {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  role?: Role;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface ListResult<T> {
  items: T[];
  continuationToken?: string;
}

export class PersonRepository {
  private container!: Container;

  async init() {
    this.container = await getContainer({ id: CONTAINER_ID, partitionKeyPath: PK_PATH });
    return this;
  }

  /** Create a new person */
  async create(input: CreatePersonDto): Promise<PersonDoc> {
    const data = CreatePersonSchema.parse(input);
    const now = new Date().toISOString();

    const doc: PersonDoc = {
      id: randomUUID(),
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email?.toLowerCase() ?? null,
      role: data.role ?? 'user',
      createdAt: now,
      updatedAt: now,
    };

    const { resource } = await this.container.items.create<PersonDoc>(doc);
    return resource!;
  }

  /** Get by id (assumes partition key is /id; if not, change the second arg) */
  async get(id: string): Promise<PersonDoc | null> {
    const { resource } = await this.container.item(id, id).read<PersonDoc>();
    return resource ?? null;
  }

  /** Update using PATCH (efficient partial update) */
  async update(id: string, patch: UpdatePersonDto): Promise<PersonDoc> {
    const data = UpdatePersonSchema.parse(patch);

    const ops: PatchOperation[] = [];
    if (data.firstName !== undefined)
      ops.push({ op: 'set', path: '/firstName', value: data.firstName.trim() });
    if (data.lastName !== undefined)
      ops.push({ op: 'set', path: '/lastName', value: data.lastName.trim() });
    if (data.email !== undefined)
      ops.push({ op: 'set', path: '/email', value: data.email?.toLowerCase() });
    if (data.role !== undefined) ops.push({ op: 'set', path: '/role', value: data.role });

    ops.push({
      op: 'set',
      path: '/updatedAt',
      value: new Date().toISOString(),
    });

    // If nothing to change but updatedAt, just return current
    if (ops.length === 1) {
      const current = await this.get(id);
      if (!current) throw new Error(`Person ${id} not found`);
      return current;
    }

    const { resource } = await this.container.item(id, id).patch<PersonDoc>(ops);
    if (!resource) {
      // Fallback: read after patch (rare)
      const current = await this.get(id);
      if (!current) throw new Error(`Person ${id} not found`);
      return current;
    }
    return resource;
  }

  /** Replace the entire document (optional helper) */
  async replace(doc: PersonDoc): Promise<PersonDoc> {
    const next: PersonDoc = { ...doc, updatedAt: new Date().toISOString() };
    const { resource } = await this.container.item(doc.id, doc.id).replace<PersonDoc>(next);
    return resource!;
  }

  /** Upsert by email: create if missing, else patch the found document */
  async upsertByEmail(input: CreatePersonDto): Promise<PersonDoc> {
    if (!input.email) return this.create(input);
    const found = await this.findByEmail(input.email);
    if (!found) return this.create(input);
    return this.update(found.id, input);
  }

  /** Delete by id */
  async delete(id: string): Promise<boolean> {
    await this.container.item(id, id).delete();
    return true;
  }

  /** List with filters + server-side pagination (continuation token under the hood) */
  async list(query: ListPeopleQuery): Promise<ListResult<PersonDoc>> {
    const parsed = ListPersonSchema.parse(query);
    const { q, role, page = 1, pageSize = 20, ids } = parsed;

    const where: string[] = ["c.type = 'person'"];
    const params: SqlParameter[] = [];

    if (q && q.trim()) {
      params.push({ name: '@qlike', value: `%${q.toLowerCase()}%` });
      where.push(
        '(LOWER(c.firstName) LIKE @qlike OR LOWER(c.lastName) LIKE @qlike OR LOWER(c.email) LIKE @qlike)',
      );
    }
    if (role) {
      params.push({ name: '@role', value: role });
      where.push('c.role = @role');
    }
    if (ids?.length) {
      params.push({ name: '@ids', value: ids });
      where.push('ARRAY_CONTAINS(@ids, c.id)');
    }

    const sql: SqlQuerySpec = {
      query: `SELECT c.id, c.firstName, c.lastName, c.email, c.role, c.createdAt, c.updatedAt
              FROM c
              WHERE ${where.join(' AND ')}
              ORDER BY c.lastName, c.firstName`,
      parameters: params,
    };

    const { items, continuationToken } = await queryPage<PersonDoc>(
      this.container,
      sql,
      page,
      pageSize,
    );

    return { items, continuationToken };
  }

  /** Find by exact email (lowercased) */
  async findByEmail(email: string): Promise<PersonDoc | null> {
    const sql: SqlQuerySpec = {
      query: "SELECT TOP 1 * FROM c WHERE c.type = 'person' AND LOWER(c.email) = @email",
      parameters: [{ name: '@email', value: email.toLowerCase() }],
    };
    const { resources } = await this.container.items.query<PersonDoc>(sql).fetchAll();
    return resources[0] ?? null;
  }
}
