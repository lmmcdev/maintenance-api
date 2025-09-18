import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ticketAttachmentParamSchema } from '../../../shared';
import { requireAuth, requireGroups, withMiddleware } from '../../../middleware';
import { env } from '../../../config/env';
import { AttachmentService } from '../attachment.service';
import { TicketService } from '../../ticket/ticket.service';
import { TicketRepository } from '../../ticket/ticket.repository';
import { AttachmentRoutes } from './index';

const downloadAttachmentHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { ticketId, attachmentId } = ticketAttachmentParamSchema.parse(req.params);

    const ticketService = new TicketService(new TicketRepository());
    const attachmentService = new AttachmentService(ticketService);
    await attachmentService.init();

    const downloadUrl = await attachmentService.getAttachmentDownloadUrl(ticketId, attachmentId);

    // Return a redirect to the blob storage URL
    return {
      status: 302,
      headers: {
        Location: downloadUrl,
      },
    };
  },
);

const handler = withMiddleware(
  [requireGroups([env.groups.maintenance]), requireAuth()],
  downloadAttachmentHandler,
);

app.http('attachment-download', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: AttachmentRoutes.download,
  handler,
});