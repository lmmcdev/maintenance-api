// src/modules/person/person.routes.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { ok, withHttp } from '../../shared';
import { PersonService } from './person.service';
import { CreatePersonSchema, ListPersonSchema } from './person.dto';
import { parseJson } from '../../shared/request';

export const listPersons = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const query = ListPersonSchema.parse(req.query);
    // Implementation for listing persons
    const service = await PersonService.createInstance();

    const result = await service.list(query);
    return ok(ctx, { message: 'List persons endpoint', data: result });
  },
);

export const createPerson = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const body = await parseJson(req, CreatePersonSchema);
    const service = await PersonService.createInstance();
    const result = await service.create(body);
    return ok(ctx, result);
  },
);

app.http('createPerson', {
  route: 'v1/persons',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: createPerson,
});

app.http('listPersons', {
  route: 'v1/persons',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: listPersons,
});
