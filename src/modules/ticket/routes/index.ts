// src/modules/ticket/routes/index.ts
import { env } from '../../../config/env';

export const API_VERSION = env.api.version;
export const TICKETS_ROUTE = env.api.ticketRoute;
const TICKETS_BASE = `${API_VERSION}/${TICKETS_ROUTE}`;

export const TicketRoutes = {
  create: TICKETS_BASE, // POST   /api/v1/tickets
  list: TICKETS_BASE, // GET    /api/v1/tickets
  get: `${TICKETS_BASE}/{id}`, // GET    /api/v1/tickets/{id}
  update: `${TICKETS_BASE}/{id}`, // PATCH  /api/v1/tickets/{id}
  status: `${TICKETS_BASE}/{id}/status`, // PATCH  /api/v1/tickets/{id}/status
  delete: `${TICKETS_BASE}/{id}`, // DELETE /api/v1/tickets/{id}
};
