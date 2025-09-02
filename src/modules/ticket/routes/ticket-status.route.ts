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

    // Reglas de timestamps derivadas del estado
    if (status === TicketStatus.RESOLVED) {
      patch.resolvedAt = now; // marcar resuelto
      // no cerramos automáticamente (ajústalo si quieres)
    } else if (status === TicketStatus.CLOSED) {
      patch.closedAt = now; // marcar cerrado
      // asegura resolvedAt si no estuviera (opcional)
      patch.resolvedAt = patch.resolvedAt ?? now;
    } else if (status === TicketStatus.OPEN || status === TicketStatus.IN_PROGRESS) {
      // re-abrir: limpiar marcas de resuelto/cerrado
      patch.resolvedAt = null;
      patch.closedAt = null;
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
