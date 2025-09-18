import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok, ticketParamSchema } from '../../../shared';
import { requireAuth, requireGroups, withMiddleware } from '../../../middleware';
import { env } from '../../../config/env';
import { AttachmentService } from '../attachment.service';
import { TicketService } from '../../ticket/ticket.service';
import { TicketRepository } from '../../ticket/ticket.repository';
import { AttachmentRoutes } from './index';

const listAttachmentsHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { ticketId } = ticketParamSchema.parse(req.params);

    const ticketService = new TicketService(new TicketRepository());
    const attachmentService = new AttachmentService(ticketService);
    await attachmentService.init();

    const attachments = await attachmentService.getTicketAttachments(ticketId);

    return ok(ctx, { items: attachments });
  },
);

const handler = withMiddleware(
  [requireGroups([env.groups.maintenance]), requireAuth()],
  listAttachmentsHandler,
);

app.http('attachment-list', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: AttachmentRoutes.list,
  handler,
});