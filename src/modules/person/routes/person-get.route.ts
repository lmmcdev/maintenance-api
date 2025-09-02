// src/modules/person/routes/person-get.route.ts
import { z } from 'zod';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok } from '../../../shared';
import { PersonService } from '../person.service';
import { PersonRepository } from '../person.repository';
import { PersonRoutes } from '.';

const ParamsSchema = z.object({ id: z.string().uuid() });

const getPersonHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = ParamsSchema.parse(req.params);

    const service = new PersonService(new PersonRepository());
    await service.init();

    const person = await service.getPerson(id);
    if (!person) {
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

    return ok(ctx, person);
  },
);

app.http('get-person', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: PersonRoutes.get, // URL final: /api/v1/persons/{id}
  handler: getPersonHandler,
});
