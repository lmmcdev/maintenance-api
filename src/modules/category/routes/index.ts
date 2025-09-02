// src/modules/category/routes/index.ts
import { env } from '../../../config/env';

export const API_VERSION = env.api.version ?? 'v1';
export const CATEGORY_ROUTE = env.api.categoryRoute ?? 'categories';

const ROUTE_BASE = `${API_VERSION}/${CATEGORY_ROUTE}`;
export const CategoryRoutes = Object.freeze({
  create: ROUTE_BASE, // POST   /api/v1/categories
  list: ROUTE_BASE, // GET    /api/v1/categories
  get: `${ROUTE_BASE}/{id}`, // GET    /api/v1/categories/{id}
  update: `${ROUTE_BASE}/{id}`, // PATCH  /api/v1/categories/{id}
  delete: `${ROUTE_BASE}/{id}`, // DELETE /api/v1/categories/{id}
  subAdd: `${ROUTE_BASE}/{id}/subcategories`, // POST
  subUpdate: `${ROUTE_BASE}/{id}/subcategories/{name}`, // PATCH
  subDelete: `${ROUTE_BASE}/{id}/subcategories/{name}`, // DELETE
});
