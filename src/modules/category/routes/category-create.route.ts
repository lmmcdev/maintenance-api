// src/modules/category/routes/category-create.route.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, created, parseJson } from '../../../shared';
import { CategoryCreateDto } from '../dtos/category-create.dto';
import { CategoryService } from '../category.service';
import { CategoryRepository } from '../category.repository';
import { CategoryRoutes } from './index';

const handler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const dto = await parseJson(req, CategoryCreateDto);
    const svc = await new CategoryService(new CategoryRepository()).init();
    const item = await svc.createCategory({
      ...dto,
      subcategories: dto.subcategories ?? [],
    } as any);
    ctx.info('Category created:', item.id);
    return created(ctx, item);
  },
);

app.http('category-create', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: CategoryRoutes.create,
  handler,
});
