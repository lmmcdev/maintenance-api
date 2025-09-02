// src/modules/category/dtos/category-create.dto.ts
import { z } from 'zod';

export const SubcategoryCreateSchema = z.object({
  name: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  isActive: z.boolean().default(true),
  order: z.coerce.number().int().min(0).optional(),
});

export const CategoryCreateDto = z
  .object({
    id: z.string().trim().toUpperCase().min(2), // ej: PREVENTIVE
    displayName: z.string().trim().min(1),
    description: z.string().trim().max(500).optional(),
    isActive: z.boolean().default(true),
    subcategories: z.array(SubcategoryCreateSchema).default([]),
  })
  .strict();

export type CategoryCreateDto = z.infer<typeof CategoryCreateDto>;
