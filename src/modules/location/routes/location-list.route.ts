import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok, parseQuery } from '../../../shared';
import { requireAuth, requireGroups, withMiddleware } from '../../../middleware';
import { env } from '../../../config/env';
import { LocationService } from '../location.service';
import { LocationRoutes } from './index';

const listLocationsHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    // Asumiendo que tienes un servicio de LocationService para manejar la lógica de negocio
    const service = new LocationService();
    const locations = await service.getAllLocations();

    return ok(ctx, { items: locations });
  },
);

const handler = withMiddleware(
  [requireGroups([env.groups.maintenance]), requireAuth()],
  listLocationsHandler,
);

app.http('locations-list', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: LocationRoutes.list,
  handler,
});
