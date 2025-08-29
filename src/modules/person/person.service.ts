// src/modules/person/person.service.ts
import type { ListResult } from './person.repository';
import { PersonRepository, type PersonDoc } from './person.repository';
import {
  type CreatePersonDto,
  type UpdatePersonDto,
  type ListPeopleQuery,
  toPersonRef,
  type PersonRef,
} from './person.dto';
import { NotFoundError } from '../../shared';

export class PersonService {
  constructor(private readonly repo: PersonRepository) {}

  static async createInstance() {
    const personRepository = await new PersonRepository().init();
    return new PersonService(personRepository);
  }

  async create(dto: CreatePersonDto): Promise<PersonDoc> {
    return this.repo.create(dto);
  }

  async get(id: string): Promise<PersonDoc> {
    const doc = await this.repo.get(id);
    if (!doc) throw new NotFoundError(`Person with id ${id} not found`);
    return doc;
  }

  async maybeGet(id: string): Promise<PersonDoc | null> {
    return this.repo.get(id);
  }

  /** Update person; throws if not found */
  async update(id: string, dto: UpdatePersonDto): Promise<PersonDoc> {
    // repo.update returns the updated doc or throws when not found in some cases
    const updated = await this.repo.update(id, dto);
    if (!updated) throw new NotFoundError(`Person with id ${id} not found`);
    return updated;
  }

  /** Delete by id (idempotent true return on success) */
  async delete(id: string): Promise<boolean> {
    // Optionally verify exists first if you want strict 404 semantics:
    const exists = await this.repo.get(id);
    if (!exists) throw new NotFoundError(`Person with id ${id} not found`);
    return this.repo.delete(id);
  }

  /** List with filters + paging */
  async list(query: ListPeopleQuery): Promise<ListResult<PersonDoc>> {
    return this.repo.list(query);
  }

  /** Find by exact email (lowercased) */
  async findByEmail(email: string): Promise<PersonDoc | null> {
    return this.repo.findByEmail(email);
  }

  /** Create if missing, otherwise update existing (by email) */
  async upsertByEmail(input: CreatePersonDto): Promise<PersonDoc> {
    return this.repo.upsertByEmail(input);
  }

  /** Ensure a person exists by email; returns existing or newly created doc */
  async ensureByEmail(input: CreatePersonDto): Promise<PersonDoc> {
    if (!input.email) return this.repo.create(input);
    const found = await this.repo.findByEmail(input.email);
    return found ?? this.repo.create(input);
  }

  /** Convert a full doc to a lightweight reference for embedding elsewhere */
  toRef(person: PersonDoc): PersonRef {
    // Ensure email is string or undefined, never null
    const safePerson = {
      ...person,
      email: person.email ?? undefined,
    };
    return toPersonRef(safePerson);
  }

  /** Bulk create with simple concurrency control (defaults to 4) */
  async bulkCreate(inputs: CreatePersonDto[], concurrency = 4): Promise<PersonDoc[]> {
    const results: PersonDoc[] = [];
    let i = 0;
    while (i < inputs.length) {
      const slice = inputs.slice(i, i + concurrency);
      const created = await Promise.all(slice.map((dto) => this.repo.create(dto)));
      results.push(...created);
      i += concurrency;
    }
    return results;
  }
}
