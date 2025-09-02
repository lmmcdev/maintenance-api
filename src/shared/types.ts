/* -------------------------- Enumerations (reusable) ------------------------- */
/* export const TICKET_STATUS = [
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
export type TicketCategory = (typeof TICKET_CATEGORY)[number]; */

import z from 'zod';

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TicketCategory {
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
  EMERGENCY = 'EMERGENCY',
  GENERAL = 'GENERAL',
}

export const PhoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(30)
  .regex(/^\+?[0-9\s\-().]+$/, 'Teléfono inválido');

export enum PersonRole {
  SUPERVISOR = 'supervisor',
  TECHNICIAN = 'technician',
}
