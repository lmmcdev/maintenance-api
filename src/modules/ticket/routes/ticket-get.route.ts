import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

import { TicketService } from '../ticket.service';
import { TicketRepository } from '../ticket.repository';
import { withHttp, idParamSchema, ok } from '../../../shared';
import { TicketRoutes } from './index';

const getTicketByIdHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const service = new TicketService(new TicketRepository());
    await service.init();
    const { id } = idParamSchema.parse(req.params);
    const data = await service.getTicket(id);
    return ok(ctx, data);
  },
);

app.http('tickets-get', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: TicketRoutes.get,
  handler: getTicketByIdHandler,
});
