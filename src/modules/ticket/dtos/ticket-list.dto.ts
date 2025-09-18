// src/modules/ticket/ticket.list.dto.ts
import { z } from 'zod';
import { TicketStatus, TicketPriority, TicketCategory } from '../../../shared';

// Fecha en YYYY-MM-DD → Date
export const DateYYYYMMDD = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado YYYY-MM-DD')
  .transform((s) => {
    const [yyyy, mm, dd] = s.split('-').map(Number);
    const d = new Date(Date.UTC(yyyy, mm - 1, dd));
    if (Number.isNaN(d.getTime())) throw new Error('Fecha inválida');
    return d;
  });

const StatusParam = z
  .string()
  .transform((val) => val.toUpperCase())
  .pipe(z.enum(TicketStatus));

const PriorityParam = z
  .string()
  .transform((val) => val.toUpperCase())
  .pipe(z.enum(TicketPriority));

const CategoryParam = z
  .string()
  .transform((val) => val.toUpperCase())
  .pipe(z.enum(TicketCategory));

export const ListTicketsQueryDto = z
  .object({
    q: z.string().trim().optional(),
    status: StatusParam.optional(),
    priority: PriorityParam.optional(),
    category: CategoryParam.optional(),

    // Rango por fecha de creación (YYYY-MM-DD)
    createdFrom: DateYYYYMMDD.optional(),
    createdTo: DateYYYYMMDD.optional(),

    // Orden
    sortBy: z.enum(['createdAt', 'updatedAt']).default('createdAt'),
    sortDir: z.enum(['asc', 'desc']).default('desc'),

    // Paginación Cosmos: usa continuationToken + limit
    limit: z.coerce.number().int().min(1).max(100).default(20),
    continuationToken: z.string().optional(),
  })
  .strict();
export type ListTicketsQueryDto = z.infer<typeof ListTicketsQueryDto>;
