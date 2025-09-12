// src/modules/person/dtos/person-create.dto.ts
import { z } from 'zod';
import { PersonRole, PhoneSchema } from '../../../shared';
import { Department } from '../person.model';

const NameSchema = z
  .string()
  .trim()
  .min(1, 'Requerido')
  .max(80, 'Máximo 80 caracteres')
  .transform((s) => s.replace(/\s+/g, ' '));

export const PersonRoleSchema = z
  .string()
  .transform((s) => s.toUpperCase())
  .pipe(z.enum(PersonRole));

export const DepartmentSchema = z
  .string()
  .transform((s) => s.toUpperCase())
  .pipe(z.enum(Department));

export const PersonCreateDto = z
  .object({
    firstName: NameSchema,
    lastName: NameSchema,
    phoneNumber: PhoneSchema.optional(),
    email: z
      .email('Email inválido')
      .trim()
      .max(254)
      .transform((s) => s.toLowerCase())
      .optional(),
    role: PersonRoleSchema.default(PersonRole.USER),
    department: DepartmentSchema.optional(),
    locationId: z.string().optional(),
  })
  .strict();

export type PersonCreateDto = z.infer<typeof PersonCreateDto>;
