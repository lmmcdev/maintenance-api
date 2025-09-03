import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

import { TicketService } from '../ticket.service';
import { TicketRepository } from '../ticket.repository';
import { withHttp, parseJson, created } from '../../../shared';
import { CreateTicketDto } from '../dtos/ticket-create.dto';
import { createNewTicket } from '../ticket.model';
import { TicketRoutes } from './index';

const createTicketHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const service = new TicketService(new TicketRepository());
    await service.init();
    const { audio, description, phoneNumber } = await parseJson(req, CreateTicketDto);

    const dto = createNewTicket(audio, description, phoneNumber);
    const data = await service.createTicket(dto);
    ctx.info('Ticket created with ID:', data.id);
    return created(ctx, data);
  },
);

app.http('tickets-create', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: TicketRoutes.create,
  handler: createTicketHandler,
});
