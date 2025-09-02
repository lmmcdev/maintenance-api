// src/modules/person/routes/person-update.route.ts
import { z } from 'zod';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok, parseJson } from '../../../shared';

import { PersonUpdateDto } from '../dtos/person-update.dto';
import { PersonService } from '../person.service';
import { PersonRepository } from '../person.repository';
import { PersonRoutes } from '.';

const ParamsSchema = z.object({ id: z.uuid() });

const updatePersonHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = ParamsSchema.parse(req.params);
    const patch = await parseJson(req, PersonUpdateDto);

    const service = new PersonService(new PersonRepository());
    await service.init();

    const updated = await service.updatePerson(id, patch);
    return ok(ctx, updated);
  },
);

app.http('persons-update', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: PersonRoutes.update,
  handler: updatePersonHandler,
});
