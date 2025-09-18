// src/modules/attachment/routes/index.ts
import { env } from '../../../config/env';

export const API_VERSION = env.api.version;
export const TICKETS_ROUTE = env.api.ticketRoute;
const ROUTE_BASE = `${API_VERSION}/${TICKETS_ROUTE}`;

export const AttachmentRoutes = {
  upload: `${ROUTE_BASE}/{ticketId}/attachments`, // POST   /api/v1/tickets/{ticketId}/attachments
  list: `${ROUTE_BASE}/{ticketId}/attachments`, // GET    /api/v1/tickets/{ticketId}/attachments
  get: `${ROUTE_BASE}/{ticketId}/attachments/{attachmentId}`, // GET    /api/v1/tickets/{ticketId}/attachments/{attachmentId}
  download: `${ROUTE_BASE}/{ticketId}/attachments/{attachmentId}/download`, // GET    /api/v1/tickets/{ticketId}/attachments/{attachmentId}/download
  migrate: `${ROUTE_BASE}/{ticketId}/attachments/migrate`, // POST   /api/v1/tickets/{ticketId}/attachments/migrate
  delete: `${ROUTE_BASE}/{ticketId}/attachments/{attachmentId}`, // DELETE /api/v1/tickets/{ticketId}/attachments/{attachmentId}
};