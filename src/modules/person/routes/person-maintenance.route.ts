import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok, parseQuery } from '../../../shared';
import { Department } from '../person.model';
import { PersonListQueryDto } from '../dtos/person-list.dto';
import { buildListPersonsSql } from '../person.query';
import { PersonRepository } from '../person.repository';
import { PersonRoutes } from './index';

const listMaintenanceWorkersHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const q = await parseQuery(req, PersonListQueryDto);

    // Force department to MAINTENANCE
    const maintenanceQuery = { ...q, department: Department.MAINTENANCE };

    const repo = new PersonRepository();
    await repo.init();

    const sql = buildListPersonsSql(maintenanceQuery);
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

app.http('persons-maintenance', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: PersonRoutes.maintenance,
  handler: listMaintenanceWorkersHandler,
});
