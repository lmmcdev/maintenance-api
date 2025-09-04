// src/modules/ticket/routes/ticket.status.route.ts
import { z } from 'zod';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok, parseJson, TicketStatus } from '../../../shared';

import { UpdateStatusDto } from '../dtos/ticket-status.dto';
import { TicketService } from '../ticket.service';
import { TicketRepository } from '../ticket.repository';
import { TicketModel } from '../ticket.model';
import { TicketRoutes } from './index';

const ParamsSchema = z.object({ id: z.string().uuid() });

const updateTicketStatusHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = ParamsSchema.parse(req.params);
    const { status } = await parseJson(req, UpdateStatusDto);

    const service = new TicketService(new TicketRepository());
    await service.init();

    const now = new Date().toISOString();
    const patch: Partial<TicketModel> = { status, updatedAt: now };

    // reglas de timestamps para 3 estados:
    if (status === TicketStatus.DONE) {
      // cerrar: marca closedAt (y opcionalmente resolvedAt para compatibilidad)

      patch.resolvedAt = patch.resolvedAt ?? now;
    } else if (status === TicketStatus.NEW || status === TicketStatus.OPEN) {
      // reabrir o en curso: limpia marcas
      patch.resolvedAt = null;
    }

    const updated = await service.updateTicket(id, patch);
    return ok(ctx, updated);
  },
);

app.http('tickets-status', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: TicketRoutes.status,
  handler: updateTicketStatusHandler,
});
