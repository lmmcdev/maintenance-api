// src/modules/person/person.repository.ts
import { SqlQuerySpec } from '@azure/cosmos';
import { CosmosRepository } from '../../infra/cosmos.repository';
import type { PersonModel } from './person.model';
import { env } from '../../config/env';

export class PersonRepository extends CosmosRepository<PersonModel> {
  constructor() {
    super(env.cosmosDB.personContainer, '/id');
  }

  async init() {
    await super.init();
    return this;
  }

  async create(
    doc: Omit<PersonModel, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<PersonModel, 'id'>>,
  ): Promise<PersonModel> {
    return super.create(doc);
  }

  async get(id: string): Promise<PersonModel | null> {
    return super.get(id);
  }

  async update(id: string, patch: Partial<PersonModel>): Promise<PersonModel> {
    return super.update(id, patch);
  }

  async delete(id: string): Promise<boolean> {
    // Con PK /id
    await this.container.item(id, id).delete();
    return true;
  }

  // Si quieres paginado simple por SQL (usa fetchAll en el base)
  async list(sql: SqlQuerySpec, page = 1, pageSize = 20) {
    return super.list(sql, page, pageSize);
  }

  // ----- Helpers específicos -----

  /** Busca una persona por email (case-insensitive). */
  async findByEmail(email: string): Promise<PersonModel | null> {
    const q: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE LOWER(c.email) = @email',
      parameters: [{ name: '@email', value: email.toLowerCase() }],
    };
    const { items } = await super.list(q, 1, 1);
    return items[0] ?? null;
  }

  async searchByName(term: string, limit = 20): Promise<PersonModel[]> {
    const q: SqlQuerySpec = {
      query:
        'SELECT * FROM c WHERE CONTAINS(c.firstName, @t, true) OR CONTAINS(c.lastName, @t, true)',
      parameters: [{ name: '@t', value: term }],
    };
    const { items } = await super.list(q, 1, limit);
    return items;
  }
}
