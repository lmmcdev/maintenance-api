import { z } from 'zod';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

import { withHttp, noContent } from '../../../shared';
import { requireAuth, requireGroups, withMiddleware } from '../../../middleware';
import { env } from '../../../config/env';
import { TicketService } from '../ticket.service';
import { TicketRepository } from '../ticket.repository';
import { TicketRoutes } from './index';

const ParamsSchema = z.object({ id: z.string().uuid() });

const deleteTicketHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = ParamsSchema.parse(req.params);

    const service = new TicketService(new TicketRepository());
    await service.init();

    const deleted = await service.deleteTicket(id);
    if (!deleted) {
      ctx.warn(`Ticket not found: ${id}`);
      return {
        status: 404,
        jsonBody: {
          success: false,
          error: { code: 'NOT_FOUND', message: `Ticket with id ${id} not found` },
          meta: { traceId: ctx.invocationId },
        },
      };
    }

    // 204 No Content
    return noContent(ctx);
  },
);

const handler = withMiddleware(
  [requireGroups([env.groups.maintenance]), requireAuth()],
  deleteTicketHandler,
);

app.http('tickets-delete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: TicketRoutes.delete, // "v1/tickets/{id}" (con /api implícito)
  handler,
});
