// src/modules/person/dtos/person-create.dto.ts
import { z } from 'zod';

const NameSchema = z
  .string()
  .trim()
  .min(1, 'Requerido')
  .max(80, 'Máximo 80 caracteres')
  .transform((s) => s.replace(/\s+/g, ' '));

export const PersonRoleSchema = z.enum(['admin', 'user']);

export const PersonCreateDto = z
  .object({
    firstName: NameSchema,
    lastName: NameSchema,
    email: z
      .email('Email inválido')
      .trim()
      .max(254)
      .transform((s) => s.toLowerCase())
      .optional(),
    role: PersonRoleSchema.default('user'),
  })
  .strict();

export type PersonCreateDto = z.infer<typeof PersonCreateDto>;
