// src/modules/ticket/ticket.update.http.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok, parseJson, TicketStatus } from '../../../shared'; // asumiendo ok() arma {status:200, jsonBody:...}
import { z } from 'zod';
import { UpdateTicketDto } from '../dtos/ticket-update.dto';
import { TicketService } from '../ticket.service';
import { TicketRepository } from '../ticket.repository';
import { TicketModel } from '../ticket.model';
import { TicketRoutes } from './index';

const ParamsSchema = z.object({ id: z.uuid() });

const updateTicketHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = ParamsSchema.parse(req.params);
    const patch = await parseJson(req, UpdateTicketDto);

    const service = new TicketService(new TicketRepository());
    await service.init();

    // Reglas de negocio: timestamps segun status
    const now = new Date().toISOString();
    const computed: Partial<TicketModel> = { updatedAt: now };

    if (patch.status === TicketStatus.RESOLVED) {
      // si no viene, setéalo
      if (patch.resolvedAt === undefined || patch.resolvedAt === null) {
        computed.resolvedAt = now;
      }
      // si re-resuelven, no cierres automáticamente (depende de tu negocio)
    } else if (patch.status === TicketStatus.CLOSED) {
      if (patch.closedAt === undefined || patch.closedAt === null) {
        computed.closedAt = now;
      }
      // si quieres, asegúrate de que haya resolvedAt:
      if (patch.resolvedAt === undefined) {
        computed.resolvedAt = patch.resolvedAt ?? now; // o deja undefined si no quieres forzarlo
      }
    } else if (patch.status === TicketStatus.OPEN || patch.status === TicketStatus.IN_PROGRESS) {
      // re-abrir: limpia resolvedAt/closedAt si no fueron explícitos
      if (patch.resolvedAt === undefined) computed.resolvedAt = null;
      if (patch.closedAt === undefined) computed.closedAt = null;
    }

    // Deduplicado de attachments (si viene)
    if (patch.attachments) {
      const seen = new Set<string>();
      computed.attachments = patch.attachments.filter((a) => {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      });
    }

    const updated = await service.updateTicket(id, { ...patch, ...computed });
    return ok(ctx, updated);
  },
);

app.http('update-ticket', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: TicketRoutes.update,
  handler: updateTicketHandler,
});
