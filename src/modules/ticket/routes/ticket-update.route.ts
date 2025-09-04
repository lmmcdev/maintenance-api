// src/modules/ticket/routes/ticket-update.route.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok, parseJson, TicketStatus } from '../../../shared';
import { z } from 'zod';
import { UpdateTicketDto } from '../dtos/ticket-update.dto';
import { TicketService } from '../ticket.service';
import { TicketRepository } from '../ticket.repository';
import { TicketModel } from '../ticket.model';
import { TicketRoutes } from './index';

import { PersonService } from '../../person/person.service';
import { PersonRepository } from '../../person/person.repository';

const ParamsSchema = z.object({ id: z.uuid() });

const updateTicketHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = ParamsSchema.parse(req.params);
    const patch = await parseJson(req, UpdateTicketDto);

    const ticketService = new TicketService(new TicketRepository());
    await ticketService.init();

    const personService = new PersonService(new PersonRepository());
    await personService.init();

    const now = new Date().toISOString();
    const computed: Partial<TicketModel> = { updatedAt: now };

    // --- reglas de estado → timestamps ---
    if (patch.status === TicketStatus.DONE) {
      if (patch.resolvedAt === undefined || patch.resolvedAt === null) computed.resolvedAt = now;
      if (patch.resolvedAt === undefined) computed.resolvedAt = patch.resolvedAt ?? now;
    } else if (patch.status === TicketStatus.NEW || patch.status === TicketStatus.OPEN) {
      if (patch.resolvedAt === undefined) computed.resolvedAt = null;
    }

    // --- dedupe attachments si vienen ---
    if (patch.attachments) {
      const seen = new Set<string>();
      computed.attachments = patch.attachments.filter((a) => {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      });
    }

    // --- resolver assigneeId → PersonModel (y sincronizar ambos campos del modelo) ---
    let assigneePatch: Partial<Pick<TicketModel, 'assigneeId' | 'assignee'>> = {};
    if ('assigneeId' in patch) {
      if (patch.assigneeId === null) {
        assigneePatch = { assigneeId: null, assignee: null };
      } else if (patch.assigneeId) {
        const person = await personService.getPerson(patch.assigneeId);
        if (!person) {
          return {
            status: 400,
            jsonBody: {
              success: false,
              error: { code: 'INVALID_ASSIGNEE', message: `Person ${patch.assigneeId} not found` },
              meta: { traceId: ctx.invocationId },
            },
          };
        }
        assigneePatch = { assigneeId: person.id, assignee: person };
      }
    }

    const payload: Partial<TicketModel> = {
      ...patch,
      ...computed,
      ...assigneePatch,
    };

    const updated = await ticketService.updateTicket(id, payload);
    return ok(ctx, updated);
  },
);

app.http('tickets-update', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: TicketRoutes.update,
  handler: updateTicketHandler,
});
