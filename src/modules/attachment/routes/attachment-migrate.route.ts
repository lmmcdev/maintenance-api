import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok, ticketParamSchema } from '../../../shared';
import { requireAuth, requireGroups, withMiddleware } from '../../../middleware';
import { env } from '../../../config/env';
import { AttachmentService } from '../attachment.service';
import { TicketService } from '../../ticket/ticket.service';
import { TicketRepository } from '../../ticket/ticket.repository';
import { AttachmentRoutes } from './index';

const migrateAttachmentsHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { ticketId } = ticketParamSchema.parse(req.params);

    const ticketService = new TicketService(new TicketRepository());
    const attachmentService = new AttachmentService(ticketService);
    await attachmentService.init();

    const migrated = await attachmentService.migrateLegacyAttachmentsForTicket(ticketId);

    ctx.info(`Migration completed for ticket ${ticketId}. Changes made: ${migrated}`);

    return ok(ctx, {
      success: true,
      migrated,
      message: migrated
        ? 'Legacy attachments have been migrated successfully'
        : 'No legacy attachments found or migration needed'
    });
  },
);

const handler = withMiddleware(
  [requireGroups([env.groups.maintenance]), requireAuth()],
  migrateAttachmentsHandler,
);

app.http('attachment-migrate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: AttachmentRoutes.migrate,
  handler,
});