// src/modules/category/routes/category-seed.route.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, created, ok } from '../../../shared';
import { CategoryService } from '../category.service';
import { CategoryRepository } from '../category.repository';
import { CategoryRoutes } from './index';

const SEED = [
  {
    id: 'PREVENTIVE',
    displayName: 'Mantenimiento Preventivo',
    isActive: true,
    subcategories: [
      { name: 'PAINTING', displayName: 'Pintado de paredes', isActive: true, order: 1 },
      { name: 'HVAC', displayName: 'Cambio de filtros de A/C', isActive: true, order: 2 },
      { name: 'GENERATOR', displayName: 'Prueba de generador eléctrico', isActive: true, order: 3 },
    ],
  },
  {
    id: 'CORRECTIVE',
    displayName: 'Mantenimiento Correctivo',
    isActive: true,
    subcategories: [
      { name: 'HVAC', displayName: 'Reparación de A/C', isActive: true, order: 1 },
      { name: 'ELECTRICAL', displayName: 'Cambio de bombillas', isActive: true, order: 2 },
      { name: 'LOCKS', displayName: 'Arreglo de cerraduras', isActive: true, order: 3 },
      { name: 'PLUMBING', displayName: 'Reparación de filtraciones', isActive: true, order: 4 },
      { name: 'FLOORING', displayName: 'Reparación de pisos', isActive: true, order: 5 },
    ],
  },
  {
    id: 'EMERGENCY',
    displayName: 'Mantenimiento de Emergencia',
    isActive: true,
    subcategories: [
      { name: 'ELECTRICAL', displayName: 'Corte eléctrico', isActive: true, order: 1 },
      { name: 'HVAC', displayName: 'Falla A/C principal', isActive: true, order: 2 },
    ],
  },
  {
    id: 'DEFERRED',
    displayName: 'Mantenimiento Diferido',
    isActive: true,
    subcategories: [
      { name: 'STRUCTURE', displayName: 'Reparación de grietas', isActive: true, order: 1 },
      { name: 'FURNITURE', displayName: 'Cambio de mobiliario', isActive: true, order: 2 },
      { name: 'CORROSION', displayName: 'Retiro de óxido superficial', isActive: true, order: 3 },
      { name: 'DOORS', displayName: 'Ajustes menores en puertas', isActive: true, order: 4 },
    ],
  },
];

const handler = withHttp(
  async (_req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const svc = await new CategoryService(new CategoryRepository()).init();

    const results = [];
    for (const cat of SEED) {
      const existing = await svc.getCategory(cat.id);
      if (existing) {
        const updated = await svc.updateCategory(cat.id, {
          displayName: cat.displayName,
          isActive: cat.isActive,
          subcategories: cat.subcategories,
        } as any);
        ctx.info(`[seed] updated ${cat.id}`);
        results.push({ id: cat.id, action: 'updated' });
      } else {
        await svc.createCategory(cat as any);
        ctx.info(`[seed] created ${cat.id}`);
        results.push({ id: cat.id, action: 'created' });
      }
    }

    const status = results.some((r) => r.action === 'created') ? 201 : 200;
    return { status, jsonBody: { success: true, results, count: results.length } };
  },
);

app.http('category-seed', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: `${CategoryRoutes.list}/seed`, // v1/categories/seed
  handler,
});
