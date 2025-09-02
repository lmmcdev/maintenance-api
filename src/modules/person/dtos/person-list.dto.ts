// src/modules/person/dtos/person-list.dto.ts
import { z } from 'zod';
import { PersonRoleSchema } from './person-create.dto';
import { PhoneSchema } from '../../../shared';

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

export const PersonListQueryDto = z
  .object({
    // Filtros
    q: z.string().trim().optional(),
    role: PersonRoleSchema.optional(),
    email: z.email().trim().toLowerCase().optional(),
    phoneNumber: PhoneSchema.optional(),

    // Rango por fechas (creación)
    createdFrom: DateDDMMYYYY.optional(),
    createdTo: DateDDMMYYYY.optional(),

    // Orden
    sortBy: z.enum(['createdAt', 'updatedAt', 'lastName', 'firstName']).default('createdAt'),
    sortDir: z.enum(['asc', 'desc']).default('desc'),

    // Paginación (tu repositorio usa page/pageSize)
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export type PersonListQueryDto = z.infer<typeof PersonListQueryDto>;
