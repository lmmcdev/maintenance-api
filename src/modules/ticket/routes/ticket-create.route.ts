import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

import { TicketService } from '../ticket.service';
import { TicketRepository } from '../ticket.repository';
import { withHttp, parseJson, created } from '../../../shared';
import { requireAuth, requireGroups, withMiddleware } from '../../../middleware';
import { env } from '../../../config/env';
import { CreateTicketDto } from '../dtos/ticket-create.dto';
import { TicketSource } from '../ticket.model';
import { AttachmentRef } from '../../attachment/attachment.dto';
import { TicketRoutes } from './index';

const createTicketHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    ctx.log('Creating ticket...');
    const body = await parseJson(req, CreateTicketDto);
    ctx.log(`Parsed request body: ${JSON.stringify(body)}`);

    const { audioString, description, fromText, attachmentsString, reporter, source } = body;

    const service = new TicketService(new TicketRepository());
    await service.init();

    // Parse audio from JSON string
    let audio: AttachmentRef | null = null;
    if (audioString) {
      try {
        const parsed = JSON.parse(audioString);
        if (parsed && typeof parsed === 'object') {
          audio = parsed;
        }
      } catch (error) {
        ctx.warn('Failed to parse audioString:', error);
        audio = null;
      }
    }

    // Parse attachments from JSON string
    let attachments: AttachmentRef[] = [];
    if (attachmentsString) {
      try {
        const parsed = JSON.parse(attachmentsString);
        if (Array.isArray(parsed)) {
          attachments = parsed;
        }
      } catch (error) {
        ctx.warn('Failed to parse attachmentsString:', error);
        attachments = [];
      }
    }

    // Convert null values to undefined for PersonModel compatibility
    const cleanReporter = reporter
      ? {
          firstName: reporter.firstName ?? undefined,
          lastName: reporter.lastName ?? undefined,
          phoneNumber: reporter.phoneNumber ?? undefined,
          email: reporter.email ?? undefined,
        }
      : undefined;

    const data = await service.createFromSource(source || TicketSource.OTHER, description, {
      audio,
      fromText,
      reporter: cleanReporter,
      attachments,
    });
    ctx.info('Ticket created with ID:', data.id);
    return created(ctx, data);
  },
);

app.http('tickets-create', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: TicketRoutes.create,
  handler: createTicketHandler,
});
