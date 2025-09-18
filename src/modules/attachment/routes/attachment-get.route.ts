import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok, ticketAttachmentParamSchema } from '../../../shared';
import { requireAuth, requireGroups, withMiddleware } from '../../../middleware';
import { env } from '../../../config/env';
import { AttachmentService } from '../attachment.service';
import { TicketService } from '../../ticket/ticket.service';
import { TicketRepository } from '../../ticket/ticket.repository';
import { AttachmentRoutes } from './index';

const getAttachmentHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { ticketId, attachmentId } = ticketAttachmentParamSchema.parse(req.params);

    const ticketService = new TicketService(new TicketRepository());
    const attachmentService = new AttachmentService(ticketService);
    await attachmentService.init();

    const attachment = await attachmentService.getAttachment(ticketId, attachmentId);

    return ok(ctx, attachment);
  },
);

const handler = withMiddleware(
  [requireGroups([env.groups.maintenance]), requireAuth()],
  getAttachmentHandler,
);

app.http('attachment-get', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: AttachmentRoutes.get,
  handler,
});