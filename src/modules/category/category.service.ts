// src/modules/category/category.service.ts
import { CategoryRepository } from './category.repository';
import { CategoryModel, SubcategoryModel } from './category.model';

export class CategoryService {
  constructor(private repo: CategoryRepository) {}

  async init() {
    await this.repo.init();
    return this;
  }

  createCategory(data: Omit<CategoryModel, 'createdAt' | 'updatedAt'>) {
    return this.repo.create(data as any);
  }

  getCategory(id: string) {
    return this.repo.get(id);
  }

  updateCategory(id: string, patch: Partial<CategoryModel>) {
    return this.repo.update(id, patch);
  }

  deleteCategory(id: string) {
    return this.repo.delete(id);
  }

  listCategories(sql?: any) {
    if (sql) return this.repo.list(sql);
    return this.repo.listActive();
  }

  addOrUpdateSubcategory(id: string, sub: SubcategoryModel) {
    return this.repo.upsertSubcategory(id, sub);
  }

  removeSubcategory(id: string, name: string) {
    return this.repo.deleteSubcategory(id, name);
  }
}
