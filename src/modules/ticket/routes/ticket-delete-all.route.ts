import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

import { TicketService } from '../ticket.service';
import { TicketRepository } from '../ticket.repository';
import { withHttp, ok } from '../../../shared';
import { TicketRoutes } from './index';

const deleteAllTicketsHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const service = new TicketService(new TicketRepository());
    await service.init();
    
    const deletedCount = await service.deleteAllTickets();
    
    ctx.info(`Deleted ${deletedCount} tickets`);
    return ok(ctx, { message: `Successfully deleted ${deletedCount} tickets`, count: deletedCount });
  },
);

app.http('tickets-delete-all', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: TicketRoutes.deleteAll,
  handler: deleteAllTicketsHandler,
});