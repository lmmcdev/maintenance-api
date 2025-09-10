// src/modules/person/person.model.ts
import type { BaseDocument } from '../../infra/cosmos.repository';
import { PersonRole } from '../../shared';

export enum Department {
  MAINTENANCE = 'MAINTENANCE', // Brigada de mantenimiento
  LOCATION = 'LOCATION' // Personal de las ubicaciones/locations
}
import type { LocationRef } from '../location/location.model';

export interface PersonModel extends BaseDocument {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email?: string;
  role?: PersonRole;
  department?: Department;
  locationId?: string;
  location?: LocationRef;
}
