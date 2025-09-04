// src/modules/category/category.model.ts
import type { BaseDocument } from '../../infra/cosmos.repository';

export interface SubcategoryModel {
  name: string;
  displayName: string;
  isActive: boolean;
  order?: number;
}

export interface CategoryModel extends BaseDocument {
  id: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  subcategories: SubcategoryModel[];
}
