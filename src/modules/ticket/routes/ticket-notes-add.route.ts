import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { z } from 'zod';

import { TicketService } from '../ticket.service';
import { TicketRepository } from '../ticket.repository';
import { withHttp, ok, fail, parseJson } from '../../../shared';
import { HTTP_STATUS } from '../../../shared/status-code';

const addNoteSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['general', 'cancellation', 'status_change', 'assignment', 'resolution']).optional().default('general'),
  createdBy: z.string().optional(),
  createdByName: z.string().optional(),
});

const addNoteHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const service = new TicketService(new TicketRepository());
    await service.init();
    
    const id = req.params.id;
    
    if (!id) {
      return fail(
        ctx,
        HTTP_STATUS.BAD_REQUEST,
        'MISSING_ID',
        'Ticket ID is required'
      );
    }

    try {
      const { content, type, createdBy, createdByName } = await parseJson(req, addNoteSchema);
      
      const updatedTicket = await service.addNoteToTicket(id, content, type, createdBy, createdByName);
      
      ctx.info(`Note added to ticket ${id}`);
      
      const notes = updatedTicket.notes || [];
      return ok(ctx, {
        ticketId: updatedTicket.id,
        notesCount: notes.length,
        lastNote: notes[notes.length - 1],
        message: 'Note added successfully'
      });
    } catch (error: any) {
      ctx.error('Error adding note to ticket:', error);
      return fail(
        ctx,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'ADD_NOTE_ERROR',
        'Failed to add note to ticket',
        error.message
      );
    }
  },
);

app.http('ticket-notes-add', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'v1/tickets/{id}/notes',
  handler: addNoteHandler,
});