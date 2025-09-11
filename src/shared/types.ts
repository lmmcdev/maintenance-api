import z from 'zod';

export enum TicketStatus {
  NEW = 'NEW',
  OPEN = 'OPEN',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
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

export const PhoneSchema = z.string().trim().min(4);

export enum PersonRole {
  SUPERVISOR = 'SUPERVISOR',
  TECHNICIAN = 'TECHNICIAN',
}
