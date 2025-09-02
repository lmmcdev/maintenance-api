// src/modules/person/dtos/person-update.dto.ts
import { z } from 'zod';
import { PersonRoleSchema } from './person-create.dto'; // reutilizamos el enum
import { PhoneSchema } from '../../../shared';

const NameSchema = z
  .string()
  .trim()
  .min(1, 'Requerido')
  .max(80, 'Máximo 80 caracteres')
  .transform((s) => s.replace(/\s+/g, ' ')); // colapsa espacios internos

export const PersonUpdateDto = z
  .object({
    firstName: NameSchema.optional(),
    lastName: NameSchema.optional(),
    phoneNumber: PhoneSchema.optional(),
    email: z
      .email('Email inválido')
      .trim()
      .max(254)
      .transform((s) => s.toLowerCase())
      .optional(),
    role: PersonRoleSchema.optional(),
  })
  .strict()
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: 'Debes enviar al menos un campo para actualizar',
  });

export type PersonUpdateDto = z.infer<typeof PersonUpdateDto>;
