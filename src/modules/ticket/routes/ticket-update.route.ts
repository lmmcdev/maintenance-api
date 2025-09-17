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
import {
  withMiddleware,
  requireAuth,
  AuthenticatedContext,
  requireGroups,
} from '../../../middleware';
import { env } from '../../../config/env';
import { LocationService } from '../../location/location.service';

const ParamsSchema = z.object({ id: z.uuid() });

const updateTicketHandler = withHttp(
  async (req: HttpRequest, ctx: AuthenticatedContext): Promise<HttpResponseInit> => {
    // auth

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

    // --- resolver assigneeIds → PersonModel (y sincronizar ambos campos del modelo) ---
    let assigneePatch: Partial<Pick<TicketModel, 'assigneeIds' | 'assignees'>> = {};
    if ('assigneeIds' in patch) {
      if (patch.assigneeIds?.length === 0 || patch.assigneeIds === null) {
        assigneePatch = { assigneeIds: null, assignees: null };
      } else if (patch.assigneeIds) {
        const persons = await Promise.all(
          patch.assigneeIds.map((id) => personService.getPerson(id)),
        );
        if (persons.some((person) => !person)) {
          return {
            status: 400,
            jsonBody: {
              success: false,
              error: { code: 'INVALID_ASSIGNEE', message: `Person ${patch.assigneeIds} not found` },
              meta: { traceId: ctx.invocationId },
            },
          };
        }
        const validPersons = persons.filter((p): p is NonNullable<typeof p> => !!p);
        assigneePatch = { assigneeIds: validPersons.map((p) => p.id), assignees: validPersons };
      }
    }

    // --- resolver locationId → LocationRef (y sincronizar ambos campos del modelo) ---
    let locationsPatch = {};
    if (patch.locationsIds) {
      const locationService = new LocationService();
      const locationRefs = await Promise.all(
        patch.locationsIds.map(async (loc) => {
          const location = await locationService.getLocation(loc.locationTypeId, loc.locationId);
          if (!location) {
            throw new Error(`Location with typeId ${loc.locationTypeId} and id ${loc.locationId} not found`);
          }
          return {
            id: loc.locationId,
            locationTypeId: loc.locationTypeId,
            location,
          };
        }),
      );
      locationsPatch = { locations: locationRefs };
    }

    const payload = {
      ...patch,
      ...computed,
      ...assigneePatch,
      ...locationsPatch,
    } as Partial<TicketModel>;

    const updated = await ticketService.updateTicket(id, payload);
    return ok(ctx, updated);
  },
);

const handler = withMiddleware(
  [requireGroups([env.groups.maintenance]), requireAuth()],
  updateTicketHandler,
);

app.http('tickets-update', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: TicketRoutes.update,
  handler,
});
