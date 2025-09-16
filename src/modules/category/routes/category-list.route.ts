// src/modules/category/routes/category-list.route.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok } from '../../../shared';
import { requireAuth, requireGroups, withMiddleware } from '../../../middleware';
import { env } from '../../../config/env';
import { CategoryService } from '../category.service';
import { CategoryRepository } from '../category.repository';
import { CategoryRoutes } from './index';

const originalHandler = withHttp(async (_req, _ctx): Promise<HttpResponseInit> => {
  const svc = await new CategoryService(new CategoryRepository()).init();
  const { items } = await svc.listCategories(); // activas por defecto
  return ok(_ctx, { items });
});

const handler = withMiddleware(
  [requireGroups([env.groups.maintenance]), requireAuth()],
  originalHandler,
);

app.http('category-list', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: CategoryRoutes.list,
  handler,
});
