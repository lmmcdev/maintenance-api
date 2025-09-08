import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

import { TicketService } from '../ticket.service';
import { TicketRepository } from '../ticket.repository';
import { withHttp, parseJson, created } from '../../../shared';
import { CreateTicketDto } from '../dtos/ticket-create.dto';
import { createNewTicket, TicketModel } from '../ticket.model';
import { TicketRoutes } from './index';

const createTicketHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const service = new TicketService(new TicketRepository());
    await service.init();
    const { audio, description, fromText } = await parseJson(req, CreateTicketDto);

    const dto: TicketModel = createNewTicket(audio, description, fromText ?? 'Unknown');
    const data = await service.createTicket(dto);
    ctx.info('Ticket created with ID:', data.id);
    return created(ctx, data);
  },
);

app.http('tickets-create', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: TicketRoutes.create,
  handler: createTicketHandler,
});
