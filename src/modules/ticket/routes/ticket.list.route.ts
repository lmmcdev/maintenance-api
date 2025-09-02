// src/modules/ticket/ticket.list.http.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok, parseQuery } from '../../../shared';
import { ListTicketsQueryDto } from '../dtos/ticket.list.dto';
import { buildListTicketsSql } from '../ticket.query';
import { TicketService } from '../ticket.service';
import { TicketRepository } from '../ticket.repository';

const listTicketsHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    // parseQuery debe convertir search params a objeto; luego Zod valida/transforma
    const query = await parseQuery(req, ListTicketsQueryDto);

    const service = new TicketService(new TicketRepository());
    await service.init();

    const sql = buildListTicketsSql(query);
    // Pásale limit y continuationToken si tu repo los soporta vía options
    // Puedes estandarizarlo así: { query, parameters, limit, continuationToken }
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

app.http('list-tickets', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'v1/tickets',
  handler: listTicketsHandler,
});
