// src/modules/ticket/taxonomy.simple.ts
import { z } from 'zod';

/**
 * Categoría simple (nivel 1)
 */
export enum TicketCategory {
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
  EMERGENCY = 'EMERGENCY',
  DEFERRED = 'DEFERRED',
  OTHER = 'OTHER',
}

/**
 * Claves internas admitidas para subcategorías (nivel 2)
 * Ajusta/expande según tu dominio.
 */
export type SubcategoryName =
  | 'PAINTING'
  | 'HVAC'
  | 'GENERATOR'
  | 'ELECTRICAL'
  | 'LOCKS'
  | 'PLUMBING'
  | 'FLOORING'
  | 'STRUCTURE'
  | 'DOORS'
  | 'CORROSION'
  | 'FURNITURE'
  | 'OTHER';

/* =========================
 *   Zod Schemas & Types
 * ========================= */

export const SubcategoryNameSchema = z.enum([
  'PAINTING',
  'HVAC',
  'GENERATOR',
  'ELECTRICAL',
  'LOCKS',
  'PLUMBING',
  'FLOORING',
  'STRUCTURE',
  'DOORS',
  'CORROSION',
  'FURNITURE',
  'OTHER',
]);

export const SimpleSubcategorySchema = z.object({
  name: SubcategoryNameSchema,
  displayName: z.string().trim().min(1),
});

export const SimpleClassificationSchema = z.object({
  category: z.enum(TicketCategory),
  subcategory: SimpleSubcategorySchema,
});

export type SimpleSubcategory = z.infer<typeof SimpleSubcategorySchema>;
export type SimpleClassification = z.infer<typeof SimpleClassificationSchema>;

/* =========================
 *   Helpers opcionales
 * ========================= */

/**
 * Crea una subcategoría garantizando displayName (si no viene, usa name).
 */
export function makeSubcategory(name: SubcategoryName, displayName?: string): SimpleSubcategory {
  return {
    name,
    displayName: (displayName ?? name).trim(),
  };
}

/**
 * Normaliza una clasificación asegurando displayName.
 */
export function normalizeClassification(input: {
  category: TicketCategory;
  subcategory: { name: SubcategoryName; displayName?: string };
}): SimpleClassification {
  return {
    category: input.category,
    subcategory: makeSubcategory(input.subcategory.name, input.subcategory.displayName),
  };
}

/**
 * Type guards por si los necesitas en el front/back.
 */
export const isTicketCategory = (v: unknown): v is TicketCategory =>
  typeof v === 'string' && (Object.values(TicketCategory) as string[]).includes(v);

export const isSubcategoryName = (v: unknown): v is SubcategoryName =>
  typeof v === 'string' && (SubcategoryNameSchema.options as readonly string[]).includes(v);
