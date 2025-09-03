// src/modules/category/routes/subcategory-add.route.ts
import { z } from 'zod';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok, parseJson } from '../../../shared';
import { SubcategoryAddDto } from '../dtos/subcategory.dto';
import { CategoryService } from '../category.service';
import { CategoryRepository } from '../category.repository';
import { CategoryRoutes } from './index';

const Params = z.object({ id: z.string().trim().toUpperCase() });

const handler = withHttp(async (req, ctx): Promise<HttpResponseInit> => {
  const { id } = Params.parse(req.params);
  const body = await parseJson(req, SubcategoryAddDto);

  const svc = await new CategoryService(new CategoryRepository()).init();
  const updated = await svc.addOrUpdateSubcategory(id, {
    name: body.name,
    displayName: body.displayName,
    isActive: body.isActive ?? true,
    order: body.order,
  });
  return ok(ctx, updated);
});

app.http('subcategory-add', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: CategoryRoutes.subAdd,
  handler,
});
