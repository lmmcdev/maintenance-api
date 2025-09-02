// src/modules/person/routes/person-update.route.ts
import { z } from 'zod';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok, parseJson } from '../../../shared';

import { PersonUpdateDto } from '../dtos/person-update.dto';
import { PersonService } from '../person.service';
import { PersonRepository } from '../person.repository';
import { PersonRoutes } from '.';

const ParamsSchema = z.object({ id: z.string().uuid() });

const updatePersonHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = ParamsSchema.parse(req.params);
    const patch = await parseJson(req, PersonUpdateDto);

    // Usamos el mismo repo para el service y para chequear unicidad
    const repo = new PersonRepository();
    await repo.init();

    // Si viene email, validar unicidad (case-insensitive)
    if (patch.email !== undefined) {
      const existing = await repo.findByEmail(patch.email);
      if (existing && existing.id !== id) {
        return {
          status: 409,
          jsonBody: {
            success: false,
            error: {
              code: 'CONFLICT',
              message: `Email ${patch.email} ya está en uso por otra persona`,
            },
            meta: { traceId: ctx.invocationId },
          },
        };
      }
    }

    const service = new PersonService(repo);
    await service.init();

    const updated = await service.updatePerson(id, patch);
    return ok(ctx, updated);
  },
);

app.http('update-person-byId', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: PersonRoutes.update, // URL final: /api/v1/persons/{id}
  handler: updatePersonHandler,
});
