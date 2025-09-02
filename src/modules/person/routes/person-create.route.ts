import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, created, parseJson } from '../../../shared';

import { PersonCreateDto } from '../dtos/person-create.dto';
import { PersonService } from '../person.service';
import { PersonRepository } from '../person.repository';
import { PersonRoutes } from './index';

const createPersonHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    // Valida y parsea body (Zod)
    const dto = await parseJson(req, PersonCreateDto);

    const service = new PersonService(new PersonRepository());
    await service.init();

    try {
      const person = await service.createPerson(dto);
      ctx.info('Person created with ID:', person.id);
      return created(ctx, person);
    } catch (err: any) {
      // Conflicto por email duplicado
      if (err?.code === 409) {
        return {
          status: 409,
          jsonBody: {
            success: false,
            error: { code: 'CONFLICT', message: err.message },
            meta: { traceId: ctx.invocationId },
          },
        };
      }
      // Re-lanza para que tu middleware/host maneje el resto
      throw err;
    }
  },
);

app.http('create-person', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: PersonRoutes.create,
  handler: createPersonHandler,
});
