// src/modules/ticket/routes/ticket.status.route.ts
import { z } from 'zod';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok, parseJson, TicketStatus } from '../../../shared';
import { requireAuth, requireGroups, withMiddleware } from '../../../middleware';
import { env } from '../../../config/env';

import { UpdateStatusDto } from '../dtos/ticket-status.dto';
import { TicketService } from '../ticket.service';
import { TicketRepository } from '../ticket.repository';
import { TicketModel } from '../ticket.model';
import { TicketRoutes } from './index';
import { EmailNotificationService } from '../../../services/email-notification.service';

const ParamsSchema = z.object({ id: z.uuid() });

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

    const updatedTicket = await service.updateTicket(id, patch);
    // Notificar por email si el ticket se cierra
    if (updatedTicket) {
      const { source, reporter, status } = updatedTicket;
      if (source === 'EMAIL') {
        const emailService = new EmailNotificationService();
        const emailData = {
          to_user: reporter?.email || '',
          email_subject: `Your ticket ${id} status updated to ${status}`,
          email_body: `Hello ${
            reporter?.firstName || 'User'
          },\n\nYour ticket with ID ${id} has been updated to status: ${status}.\n\nThank you.`,
        };
        await emailService.sendEmail(emailData);
      }
    }
    return ok(ctx, updatedTicket);
  },
);

const handler = withMiddleware(
  [requireGroups([env.groups.maintenance]), requireAuth()],
  updateTicketStatusHandler,
);

app.http('tickets-status', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: TicketRoutes.status,
  handler,
});
