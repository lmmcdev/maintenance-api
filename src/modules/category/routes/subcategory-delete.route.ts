// src/modules/category/routes/subcategory-delete.route.ts
import { z } from 'zod';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok } from '../../../shared';
import { requireAuth, requireGroups, withMiddleware } from '../../../middleware';
import { env } from '../../../config/env';
import { CategoryService } from '../category.service';
import { CategoryRepository } from '../category.repository';
import { CategoryRoutes } from './index';

const Params = z.object({
  id: z.string().trim().toUpperCase(),
  name: z.string().trim(),
});

const originalHandler = withHttp(async (req, ctx): Promise<HttpResponseInit> => {
  const { id, name } = Params.parse(req.params);
  const svc = await new CategoryService(new CategoryRepository()).init();
  const updated = await svc.removeSubcategory(id, name);
  return ok(ctx, updated);
});

const handler = withMiddleware(
  [requireGroups([env.groups.maintenance]), requireAuth()],
  originalHandler,
);

app.http('subcategory-delete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: CategoryRoutes.subDelete,
  handler,
});
