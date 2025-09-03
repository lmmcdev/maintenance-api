// src/modules/ticket/ticket.list.http.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok, parseQuery } from '../../../shared';
import { ListTicketsQueryDto } from '../dtos/ticket-list.dto';
import { buildListTicketsSql } from '../ticket.query';
import { TicketService } from '../ticket.service';
import { TicketRepository } from '../ticket.repository';
import { TicketRoutes } from './index';

const listTicketsHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const query = await parseQuery(req, ListTicketsQueryDto);

    const service = new TicketService(new TicketRepository());
    await service.init();

    const sql = buildListTicketsSql(query);

    const { items, continuationToken } = await service.listTickets({
      ...sql,
      limit: query.limit,
      continuationToken: query.continuationToken,
    });

    return ok(ctx, {
      items,
      pageInfo: {
        limit: query.limit,
        continuationToken, // devuelve esto para la siguiente página
        sortBy: query.sortBy,
        sortDir: query.sortDir,
      },
    });
  },
);

app.http('tickets-list', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: TicketRoutes.list,
  handler: listTicketsHandler,
});
