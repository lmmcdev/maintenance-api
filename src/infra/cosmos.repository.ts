// src/infra/cosmos.repository.ts
import { Container, SqlQuerySpec, PatchOperation } from '@azure/cosmos';
import { getContainer } from './data-source';

export interface BaseDocument {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListResult<T> {
  items: T[];
  continuationToken?: string;
}

export class CosmosRepository<T extends BaseDocument> {
  protected container!: Container;
  protected containerId: string;
  protected partitionKeyPath: string;

  constructor(containerId: string, partitionKeyPath = '/id') {
    this.containerId = containerId;
    this.partitionKeyPath = partitionKeyPath;
  }

  async init() {
    this.container = await getContainer({
      id: this.containerId,
      partitionKeyPath: this.partitionKeyPath,
    });
    return this;
  }

  async create(
    doc: Omit<T, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<T, 'id'>>,
  ): Promise<T> {
    const now = new Date().toISOString();
    const item: T = {
      ...doc,
      id: doc.id ?? crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    } as T;
    const { resource } = await this.container.items.create<T>(item);
    return resource!;
  }

  async get(id: string): Promise<T | null> {
    const { resource } = await this.container.item(id, id).read<T>();
    return resource ?? null;
  }

  async update(id: string, patch: Partial<T>): Promise<T> {
    const ops: PatchOperation[] = Object.entries(patch).map(([key, value]) => ({
      op: 'set',
      path: `/${key}`,
      value,
    }));
    ops.push({ op: 'set', path: '/updatedAt', value: new Date().toISOString() });
    const { resource } = await this.container.item(id, id).patch<T>(ops);
    if (!resource) throw new Error(`Document ${id} not found`);
    return resource;
  }

  async replace(doc: T): Promise<T> {
    const next: T = { ...doc, updatedAt: new Date().toISOString() };
    const { resource } = await this.container.item(doc.id, doc.id).replace<T>(next);
    return resource!;
  }

  async delete(id: string): Promise<boolean> {
    await this.container.item(id, id).delete();
    return true;
  }

  async list(sql: SqlQuerySpec, page = 1, pageSize = 20): Promise<ListResult<T>> {
    // You may want to implement continuation token logic for real paging
    const { resources } = await this.container.items.query<T>(sql).fetchAll();
    return { items: resources };
  }
}
