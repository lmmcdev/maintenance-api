// src/modules/category/category.repository.ts
import { SqlQuerySpec } from '@azure/cosmos';
import { CosmosRepository } from '../../infra/cosmos.repository';
import { CategoryModel, SubcategoryModel } from './category.model';

export class CategoryRepository extends CosmosRepository<CategoryModel> {
  constructor() {
    super('categories', '/id');
  }

  async init() {
    await super.init();
    return this;
  }

  async create(
    doc: Omit<CategoryModel, 'createdAt' | 'updatedAt'> & Partial<Pick<CategoryModel, 'id'>>,
  ) {
    return super.create(doc as any);
  }

  async listActive(): Promise<{ items: CategoryModel[] }> {
    const sql: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE c.isActive = true ORDER BY c.id ASC',
      parameters: [],
    };
    return super.list(sql, 1, 1000);
  }

  async upsertSubcategory(id: string, sub: SubcategoryModel): Promise<CategoryModel> {
    const cat = await this.get(id);
    if (!cat) throw Object.assign(new Error(`Category ${id} not found`), { code: 404 });

    const idx = cat.subcategories.findIndex((s) => s.name === sub.name);
    if (idx >= 0) cat.subcategories[idx] = { ...cat.subcategories[idx], ...sub };
    else cat.subcategories.push(sub);

    return this.replace(cat);
  }

  async deleteSubcategory(id: string, name: string): Promise<CategoryModel> {
    const cat = await this.get(id);
    if (!cat) throw Object.assign(new Error(`Category ${id} not found`), { code: 404 });

    cat.subcategories = cat.subcategories.filter((s) => s.name !== name);
    return this.replace(cat);
  }
}
