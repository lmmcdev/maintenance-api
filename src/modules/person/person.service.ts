import { ConflictError } from '../../shared';
import { PersonModel } from './person.model';
import { PersonRepository } from './person.repository';

export class PersonService {
  private personRepository: PersonRepository;

  constructor(personRepository: PersonRepository) {
    this.personRepository = personRepository;
  }

  async init() {
    await this.personRepository.init();
    return this;
  }

  /**
   * Crea una persona. Si viene email, verifica unicidad (case-insensitive).
   */
  async createPerson(
    data: Omit<PersonModel, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<PersonModel> {
    if (data.email) {
      const existing = await this.personRepository.findByEmail(data.email);
      if (existing) {
        throw new ConflictError(`Person with email ${data.email} already exists`);
      }
    }
    return this.personRepository.create(data);
  }

  async getPerson(id: string): Promise<PersonModel | null> {
    return this.personRepository.get(id);
  }

  async updatePerson(id: string, patch: Partial<PersonModel>): Promise<PersonModel> {
    return this.personRepository.update(id, patch);
  }

  async deletePerson(id: string): Promise<boolean> {
    return this.personRepository.delete(id);
  }
}
