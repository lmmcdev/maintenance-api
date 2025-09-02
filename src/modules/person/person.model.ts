// src/modules/person/person.model.ts
import type { BaseDocument } from '../../infra/cosmos.repository';
import { PersonRole } from '../../shared';

export interface PersonModel extends BaseDocument {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email?: string;
  role?: PersonRole;
}
