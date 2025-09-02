// src/modules/ticket/ticket.list.dto.ts
import { z } from 'zod';
import { TicketStatus, TicketPriority, TicketCategory } from '../../../shared';

// Fecha en DD-MM-YYYY → Date
export const DateDDMMYYYY = z
  .string()
  .regex(/^\d{2}-\d{2}-\d{4}$/, 'Formato esperado DD-MM-YYYY')
  .transform((s) => {
    const [dd, mm, yyyy] = s.split('-').map(Number);
    const d = new Date(Date.UTC(yyyy, mm - 1, dd));
    if (Number.isNaN(d.getTime())) throw new Error('Fecha inválida');
    return d;
  });

export const ListTicketsQueryDto = z
  .object({
    // Filtros
    q: z.string().trim().optional(),
    status: z.enum(TicketStatus).optional(),
    priority: z.enum(TicketPriority).optional(),
    category: z.enum(TicketCategory).optional(),

    // Rango por fecha de creación (DD-MM-YYYY)
    createdFrom: DateDDMMYYYY.optional(),
    createdTo: DateDDMMYYYY.optional(),

    // Orden
    sortBy: z.enum(['createdAt', 'updatedAt']).default('createdAt'),
    sortDir: z.enum(['asc', 'desc']).default('desc'),

    // Paginación Cosmos: usa continuationToken + limit
    limit: z.coerce.number().int().min(1).max(100).default(20),
    continuationToken: z.string().optional(),
  })
  .strict();
export type ListTicketsQueryDto = z.infer<typeof ListTicketsQueryDto>;
