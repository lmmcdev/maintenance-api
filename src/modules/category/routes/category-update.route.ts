// src/modules/category/routes/category-update.route.ts
import { z } from 'zod';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok, parseJson } from '../../../shared';
import { requireAuth, requireGroups, withMiddleware } from '../../../middleware';
import { env } from '../../../config/env';
import { CategoryService } from '../category.service';
import { CategoryRepository } from '../category.repository';
import { CategoryRoutes } from './index';
import { CategoryUpdateDto } from '../dtos/category-update.dto';

const Params = z.object({ id: z.string().trim().toUpperCase() });

const originalHandler = withHttp(async (req, ctx): Promise<HttpResponseInit> => {
  const { id } = Params.parse(req.params);
  const patch = await parseJson(req, CategoryUpdateDto);
  const svc = await new CategoryService(new CategoryRepository()).init();
  const updated = await svc.updateCategory(id, patch as any);
  return ok(ctx, updated);
});

const handler = withMiddleware(
  [requireGroups([env.groups.maintenance]), requireAuth()],
  originalHandler,
);

app.http('category-update', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: CategoryRoutes.update,
  handler,
});
