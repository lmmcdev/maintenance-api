import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

import { idParamSchema, ok, withHttp } from '../../shared';
import { TicketService } from '../../services/ticket.service';
import { TicketCreateSchema } from '../../schemas/ticket.schema';
import { parseJson } from '../../shared/request';

const path = 'v1/tickets';

export const createTicketHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const body = await parseJson(req, TicketCreateSchema);

    const ticketService = await TicketService.createInstance();
    const ticket = await ticketService.createTicket(body);
    return ok(ctx, ticket);
  },
);

export const getTicketById = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = idParamSchema.parse((req as any).params ?? {});

    const ticketService = await TicketService.createInstance();
    const ticket = await ticketService.getTicket(id);
    return ok(ctx, ticket);
  },
);

export const listTicketsHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    // Here you would typically call a service to create the ticket
    // For this example, we'll just return the received data
    return ok(ctx, {});
  },
);

app.http('tickets-create', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: path,
  handler: createTicketHandler,
});

app.http('tickets-list', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: path,
  handler: listTicketsHandler,
});

app.http('tickets-getById', {
  methods: ['GET'],
  route: `${path}/{id}`,
  authLevel: 'function',
  handler: getTicketById,
});
