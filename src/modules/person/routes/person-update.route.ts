// src/modules/person/routes/person-update.route.ts
import { z } from 'zod';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok, parseJson } from '../../../shared';

import { PersonUpdateDto } from '../dtos/person-update.dto';
import { PersonService } from '../person.service';
import { PersonRepository } from '../person.repository';

const ParamsSchema = z.object({ id: z.uuid() });

const updatePersonHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = ParamsSchema.parse(req.params);
    const patch = await parseJson(req, PersonUpdateDto);

    const service = new PersonService(new PersonRepository());
    await service.init();

    // Nota: si quieres validar unicidad de email aquí, puedes hacerlo antes del update.
    // El repositorio base ya actualiza updatedAt vía patch.

    const updated = await service.updatePerson(id, patch);
    return ok(ctx, updated);
  },
);

app.http('update-person', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'v1/persons/{id}', // URL final: /api/v1/persons/{id}
  handler: updatePersonHandler,
});
