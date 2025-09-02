// src/modules/person/routes/index.ts
import { env } from '../../../config/env';

export const API_VERSION = env.api.version;
export const PERSONS_ROUTE = env.api.personRoute;
const ROUTE_BASE = `${API_VERSION}/${PERSONS_ROUTE}`;

export const PersonRoutes = {
  create: ROUTE_BASE, // POST   /api/v1/persons
  list: ROUTE_BASE, // GET    /api/v1/persons
  get: `${ROUTE_BASE}/{id}`, // GET    /api/v1/persons/{id}
  update: `${ROUTE_BASE}/{id}`, // PATCH  /api/v1/persons/{id}
  delete: `${ROUTE_BASE}/{id}`, // DELETE /api/v1/persons/{id}
};
