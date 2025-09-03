// src/modules/category/routes/category-get.route.ts
import { z } from 'zod';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok } from '../../../shared';
import { CategoryService } from '../category.service';
import { CategoryRepository } from '../category.repository';
import { CategoryRoutes } from './index';

const Params = z.object({ id: z.string().trim().toUpperCase() });

const handler = withHttp(async (req, ctx): Promise<HttpResponseInit> => {
  const { id } = Params.parse(req.params);
  const svc = await new CategoryService(new CategoryRepository()).init();
  const item = await svc.getCategory(id);
  if (!item) {
    return {
      status: 404,
      jsonBody: {
        success: false,
        error: { code: 'NOT_FOUND', message: `Category ${id} not found` },
        meta: { traceId: ctx.invocationId },
      },
    };
  }
  return ok(ctx, item);
});

app.http('category-get', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: CategoryRoutes.get,
  handler,
});
