// src/modules/person/person.model.ts
import type { BaseDocument } from '../../infra/cosmos.repository';

export interface PersonModel extends BaseDocument {
  firstName: string;
  lastName: string;
  email?: string;
  role?: 'admin' | 'user';
}
