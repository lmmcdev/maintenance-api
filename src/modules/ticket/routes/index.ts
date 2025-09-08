// src/modules/ticket/routes/index.ts
import { env } from '../../../config/env';

export const API_VERSION = env.api.version;
export const TICKETS_ROUTE = env.api.ticketRoute;
const ROUTE_BASE = `${API_VERSION}/${TICKETS_ROUTE}`;

export const TicketRoutes = {
  create: ROUTE_BASE, // POST   /api/v1/tickets
  list: ROUTE_BASE, // GET    /api/v1/tickets
  get: `${ROUTE_BASE}/{id}`, // GET    /api/v1/tickets/{id}
  update: `${ROUTE_BASE}/{id}`, // PATCH  /api/v1/tickets/{id}
  status: `${ROUTE_BASE}/{id}/status`, // PATCH  /api/v1/tickets/{id}/status
  delete: `${ROUTE_BASE}/{id}`, // DELETE /api/v1/tickets/{id}
  deleteAll: `${ROUTE_BASE}/delete/all`, // DELETE /api/v1/tickets/all
};
