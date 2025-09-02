// src/modules/category/dtos/subcategory.dto.ts
import { z } from 'zod';

export const SubcategoryAddDto = z
  .object({
    name: z.string().trim().min(1),
    displayName: z.string().trim().min(1),
    isActive: z.boolean().default(true),
    order: z.coerce.number().int().min(0).optional(),
  })
  .strict();

export const SubcategoryUpdateDto = z
  .object({
    displayName: z.string().trim().min(1).optional(),
    isActive: z.boolean().optional(),
    order: z.coerce.number().int().min(0).optional(),
  })
  .strict()
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: 'Debes enviar al menos un campo para actualizar',
  });

export type SubcategoryAddDto = z.infer<typeof SubcategoryAddDto>;
export type SubcategoryUpdateDto = z.infer<typeof SubcategoryUpdateDto>;
