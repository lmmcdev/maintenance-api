// src/modules/person/routes/index.ts
import { env } from '../../../config/env';

export const API_VERSION = env.api.version;
export const PERSONS_ROUTE = env.api.personRoute;
const TICKETS_BASE = `${API_VERSION}/${PERSONS_ROUTE}`;

export const PersonRoutes = {
  create: TICKETS_BASE, // POST   /api/v1/persons
  list: TICKETS_BASE, // GET    /api/v1/persons
  get: `${TICKETS_BASE}/{id}`, // GET    /api/v1/persons/{id}
  update: `${TICKETS_BASE}/{id}`, // PATCH  /api/v1/tickets/{id}
  delete: `${TICKETS_BASE}/{id}`, // DELETE /api/v1/persons/{id}
};
