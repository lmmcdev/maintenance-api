// src/modules/category/routes/subcategory-update.route.ts
import { z } from 'zod';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok, parseJson } from '../../../shared';
import { SubcategoryUpdateDto } from '../dtos/subcategory.dto';
import { CategoryService } from '../category.service';
import { CategoryRepository } from '../category.repository';
import { CategoryRoutes } from './index';

const Params = z.object({
  id: z.string().trim().toUpperCase(),
  name: z.string().trim(),
});

const handler = withHttp(async (req, ctx): Promise<HttpResponseInit> => {
  const { id, name } = Params.parse(req.params);
  const patch = await parseJson(req, SubcategoryUpdateDto);

  const svc = await new CategoryService(new CategoryRepository()).init();
  const cat = await svc.getCategory(id);
  if (!cat)
    return {
      status: 404,
      jsonBody: {
        success: false,
        error: { code: 'NOT_FOUND', message: `Category ${id} not found` },
      },
    };

  const existing = cat.subcategories.find((s) => s.name === name);
  if (!existing)
    return {
      status: 404,
      jsonBody: {
        success: false,
        error: { code: 'NOT_FOUND', message: `Subcategory ${name} not found in ${id}` },
      },
    };

  const updated = await svc.addOrUpdateSubcategory(id, { ...existing, ...patch });
  return ok(ctx, updated);
});

app.http('subcategory-update', {
  methods: ['PATCH', 'OPTIONS'],
  authLevel: 'anonymous',
  route: CategoryRoutes.subUpdate,
  handler,
});
