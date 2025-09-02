export const API_V = 'v1';
export const TICKETS_BASE = `${API_V}/tickets`;

export const TicketRoutes = {
  create: TICKETS_BASE, // POST   /api/v1/tickets
  list: TICKETS_BASE, // GET    /api/v1/tickets
  get: `${TICKETS_BASE}/{id}`, // GET    /api/v1/tickets/{id}
  update: `${TICKETS_BASE}/{id}`, // PATCH  /api/v1/tickets/{id}
  status: `${TICKETS_BASE}/{id}/status`, // PATCH  /api/v1/tickets/{id}/status
};
