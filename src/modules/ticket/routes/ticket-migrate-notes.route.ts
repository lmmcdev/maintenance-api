import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

import { TicketService } from '../ticket.service';
import { TicketRepository } from '../ticket.repository';
import { withHttp, ok, fail } from '../../../shared';
import { HTTP_STATUS } from '../../../shared/status-code';
import { requireAuth, requireGroups, withMiddleware } from '../../../middleware';
import { env } from '../../../config/env';

const migrateNotesHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const service = new TicketService(new TicketRepository());
    await service.init();

    try {
      // Obtener todos los tickets para verificar y migrar si es necesario
      const ticketsResult = await service.listTickets({});
      const allTickets = ticketsResult.items;
      let migratedCount = 0;

      for (const ticket of allTickets) {
        // Si el ticket no tiene el campo notes o no es un array, agregar array vacío
        if (!Array.isArray(ticket.notes)) {
          await service.updateTicket(ticket.id, {
            notes: [],
            updatedAt: new Date().toISOString(),
          });
          migratedCount++;
        }
      }

      ctx.info(`Migration completed. ${migratedCount} tickets migrated out of ${allTickets.length} total tickets.`);

      return ok(ctx, {
        totalTickets: allTickets.length,
        migratedTickets: migratedCount,
        message: 'Notes migration completed successfully'
      });
    } catch (error: any) {
      ctx.error('Error during notes migration:', error);
      return fail(
        ctx,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'MIGRATION_ERROR',
        'Failed to migrate ticket notes',
        error.message
      );
    }
  },
);

const handler = withMiddleware(
  [requireGroups([env.groups.maintenance]), requireAuth()],
  migrateNotesHandler,
);

app.http('ticket-migrate-notes', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'v1/tickets/migrate/notes',
  handler: handler,
});