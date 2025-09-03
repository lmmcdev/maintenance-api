// src/modules/category/routes/category-list.route.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok } from '../../../shared';
import { CategoryService } from '../category.service';
import { CategoryRepository } from '../category.repository';
import { CategoryRoutes } from './index';

const handler = withHttp(async (_req, _ctx): Promise<HttpResponseInit> => {
  const svc = await new CategoryService(new CategoryRepository()).init();
  const { items } = await svc.listCategories(); // activas por defecto
  return ok(_ctx, { items });
});

app.http('category-list', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: CategoryRoutes.list,
  handler,
});
