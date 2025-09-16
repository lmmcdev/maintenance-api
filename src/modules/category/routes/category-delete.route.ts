// src/modules/category/routes/category-delete.route.ts
import { z } from 'zod';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, noContent } from '../../../shared';
import { requireAuth, requireGroups, withMiddleware } from '../../../middleware';
import { env } from '../../../config/env';
import { CategoryService } from '../category.service';
import { CategoryRepository } from '../category.repository';
import { CategoryRoutes } from './index';

const Params = z.object({ id: z.string().trim().toUpperCase() });

const originalHandler = withHttp(async (req, ctx): Promise<HttpResponseInit> => {
  const { id } = Params.parse(req.params);
  const svc = await new CategoryService(new CategoryRepository()).init();
  const existed = await svc.getCategory(id);
  if (!existed)
    return {
      status: 404,
      jsonBody: {
        success: false,
        error: { code: 'NOT_FOUND', message: `Category ${id} not found` },
        meta: { traceId: ctx.invocationId },
      },
    };
  await svc.deleteCategory(id);
  return noContent(ctx);
});

const handler = withMiddleware(
  [requireGroups([env.groups.maintenance]), requireAuth()],
  originalHandler,
);

app.http('category-delete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: CategoryRoutes.delete,
  handler,
});
