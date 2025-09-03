// src/modules/person/routes/person-delete.route.ts
import { z } from 'zod';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, noContent } from '../../../shared';
import { PersonService } from '../person.service';
import { PersonRepository } from '../person.repository';
import { PersonRoutes } from './index';

const ParamsSchema = z.object({ id: z.string().uuid() });

const deletePersonHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = ParamsSchema.parse(req.params);

    const service = new PersonService(new PersonRepository());
    await service.init();

    // Opcional pero útil: 404 si no existe
    const existing = await service.getPerson(id);
    if (!existing) {
      ctx.warn(`Person not found: ${id}`);
      return {
        status: 404,
        jsonBody: {
          success: false,
          error: { code: 'NOT_FOUND', message: `Person with id ${id} not found` },
          meta: { traceId: ctx.invocationId },
        },
      };
    }

    await service.deletePerson(id);
    return noContent(ctx);
  },
);

app.http('persons-delete-byId', {
  methods: ['DELETE', 'OPTIONS'],
  authLevel: 'anonymous',
  route: PersonRoutes.delete, // p.ej. "v1/persons/{id}"
  handler: deletePersonHandler,
});
