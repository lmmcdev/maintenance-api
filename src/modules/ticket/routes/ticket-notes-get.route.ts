import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

import { TicketService } from '../ticket.service';
import { TicketRepository } from '../ticket.repository';
import { withHttp, ok, fail } from '../../../shared';
import { HTTP_STATUS } from '../../../shared/status-code';

const getNotesHandler = withHttp(
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
      const notes = await service.getTicketNotes(id);
      
      // Ordenar notas por fecha de creación (más recientes primero)
      const sortedNotes = notes.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      ctx.info(`Retrieved ${notes.length} notes for ticket ${id}`);
      
      return ok(ctx, {
        ticketId: id,
        notes: sortedNotes,
        totalCount: notes.length
      });
    } catch (error: any) {
      ctx.error('Error getting ticket notes:', error);
      return fail(
        ctx,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'GET_NOTES_ERROR',
        'Failed to get ticket notes',
        error.message
      );
    }
  },
);

app.http('ticket-notes-get', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'v1/tickets/{id}/notes',
  handler: getNotesHandler,
});