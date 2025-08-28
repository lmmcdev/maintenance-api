/* -------------------------- Enumerations (reusable) ------------------------- */
export const TICKET_STATUS = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
] as const;
export const TICKET_PRIORITY = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const TICKET_CATEGORY = [
  "PREVENTIVE",
  "CORRECTIVE",
  "EMERGENCY",
  "OTHER",
] as const;

export type TicketStatus = (typeof TICKET_STATUS)[number];
export type TicketPriority = (typeof TICKET_PRIORITY)[number];
export type TicketCategory = (typeof TICKET_CATEGORY)[number];
