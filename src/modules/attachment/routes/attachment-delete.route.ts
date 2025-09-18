import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok, ticketAttachmentParamSchema } from '../../../shared';
import { requireAuth, requireGroups, withMiddleware } from '../../../middleware';
import { env } from '../../../config/env';
import { AttachmentService } from '../attachment.service';
import { TicketService } from '../../ticket/ticket.service';
import { TicketRepository } from '../../ticket/ticket.repository';
import { AttachmentDeleteRequest } from '../attachment.dto';
import { AttachmentRoutes } from './index';

const deleteAttachmentHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { ticketId, attachmentId } = ticketAttachmentParamSchema.parse(req.params);

    const deleteRequest: AttachmentDeleteRequest = {
      ticketId,
      attachmentId,
    };

    const ticketService = new TicketService(new TicketRepository());
    const attachmentService = new AttachmentService(ticketService);
    await attachmentService.init();

    await attachmentService.deleteAttachment(deleteRequest);

    ctx.info(`Attachment ${attachmentId} deleted from ticket ${ticketId}`);
    return ok(ctx, { success: true, message: 'Attachment deleted successfully' });
  },
);

const handler = withMiddleware(
  [requireGroups([env.groups.maintenance]), requireAuth()],
  deleteAttachmentHandler,
);

app.http('attachment-delete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: AttachmentRoutes.delete,
  handler,
});