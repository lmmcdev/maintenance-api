import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok } from '../../../shared';
import { requireAuth, requireGroups, withMiddleware } from '../../../middleware';
import { env } from '../../../config/env';
import { AttachmentService } from '../attachment.service';
import { TicketService } from '../../ticket/ticket.service';
import { TicketRepository } from '../../ticket/ticket.repository';

const migrateAllAttachmentsHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const ticketService = new TicketService(new TicketRepository());
    const attachmentService = new AttachmentService(ticketService);
    await attachmentService.init();

    // Get all tickets with attachments
    const allTicketsQuery = {
      query: 'SELECT * FROM c WHERE ARRAY_LENGTH(c.attachments) > 0'
    };

    const { items: tickets } = await ticketService.listTickets(allTicketsQuery);

    let migratedCount = 0;
    let errorCount = 0;
    const results: { ticketId: string; migrated: boolean; error?: string }[] = [];

    for (const ticket of tickets) {
      try {
        const migrated = await attachmentService.migrateLegacyAttachmentsForTicket(ticket.id);
        results.push({ ticketId: ticket.id, migrated });
        if (migrated) {
          migratedCount++;
        }
        ctx.log(`Ticket ${ticket.id}: ${migrated ? 'migrated' : 'no migration needed'}`);
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ ticketId: ticket.id, migrated: false, error: errorMessage });
        ctx.error(`Error migrating ticket ${ticket.id}:`, error);
      }
    }

    ctx.info(`Migration completed. Total tickets: ${tickets.length}, Migrated: ${migratedCount}, Errors: ${errorCount}`);

    return ok(ctx, {
      success: true,
      summary: {
        totalTickets: tickets.length,
        migratedTickets: migratedCount,
        errorsCount: errorCount,
      },
      results: results.slice(0, 50), // Limit to first 50 results to avoid large responses
      message: `Migration completed. ${migratedCount} tickets were migrated successfully.`
    });
  },
);

const handler = withMiddleware(
  [requireGroups([env.groups.maintenance]), requireAuth()],
  migrateAllAttachmentsHandler,
);

app.http('attachment-migrate-all', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'v1/attachments/migrate-all',
  handler,
});