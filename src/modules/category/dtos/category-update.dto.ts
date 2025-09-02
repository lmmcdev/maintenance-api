// src/modules/category/dtos/category-update.dto.ts
import { z } from 'zod';
import { SubcategoryCreateSchema } from './category-create.dto';

export const CategoryUpdateDto = z
  .object({
    displayName: z.string().trim().min(1).optional(),
    description: z.string().trim().max(500).optional(),
    isActive: z.boolean().optional(),
    subcategories: z.array(SubcategoryCreateSchema).optional(), // reemplazo total si lo envías
  })
  .strict()
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: 'Debes enviar al menos un campo para actualizar',
  });

export type CategoryUpdateDto = z.infer<typeof CategoryUpdateDto>;
