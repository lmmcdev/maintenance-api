// src/modules/category/category.model.ts
import type { BaseDocument } from '../../infra/cosmos.repository';

export interface SubcategoryModel {
  name: string; // clave interna (ej: PAINTING)
  displayName: string; // ej: Pintado de paredes
  isActive: boolean;
  order?: number;
}

export interface CategoryModel extends BaseDocument {
  id: string; // clave de categoría (ej: PREVENTIVE)
  displayName: string; // ej: Mantenimiento Preventivo
  description?: string;
  isActive: boolean;
  subcategories: SubcategoryModel[];
}
