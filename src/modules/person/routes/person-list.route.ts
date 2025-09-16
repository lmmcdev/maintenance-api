import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok, parseQuery } from '../../../shared';
import { requireAuth, requireGroups, withMiddleware } from '../../../middleware';
import { env } from '../../../config/env';

import { PersonListQueryDto } from '../dtos/person-list.dto';
import { buildListPersonsSql } from '../person.query';
import { PersonRepository } from '../person.repository';
import { PersonRoutes } from './index';

const listPersonsHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const q = await parseQuery(req, PersonListQueryDto);

    const repo = new PersonRepository();
    await repo.init();

    const sql = buildListPersonsSql(q);
    const limit = q.limit ?? 20;

    const { items } = await repo.list({ ...sql, limit });

    return ok(ctx, {
      items,
      pageInfo: {
        limit,
        sortBy: q.sortBy,
        sortDir: q.sortDir,
      },
    });
  },
);

const handler = withMiddleware(
  [requireGroups([env.groups.maintenance]), requireAuth()],
  listPersonsHandler,
);

app.http('persons-list', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: PersonRoutes.list,
  handler,
});
