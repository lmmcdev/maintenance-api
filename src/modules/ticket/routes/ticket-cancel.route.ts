import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { z } from 'zod';

import { TicketService } from '../ticket.service';
import { TicketRepository } from '../ticket.repository';
import { withHttp, ok, fail } from '../../../shared';
import { HTTP_STATUS } from '../../../shared/status-code';

const cancelSchema = z.object({
  reason: z.string().optional(),
  cancelledBy: z.string().optional(),
  cancelledByName: z.string().optional(),
}).optional();

const cancelTicketHandler = withHttp(
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
      // Parse optional request body for cancellation details
      let cancelData: z.infer<typeof cancelSchema> = {};
      try {
        const body = await req.json();
        if (body) {
          cancelData = cancelSchema.parse(body);
        }
      } catch {
        // Si no hay body o no es válido, usar valores por defecto
        cancelData = {};
      }

      // Get the ticket first to check if it exists
      const ticket = await service.getById(id);
      
      if (!ticket) {
        return fail(
          ctx,
          HTTP_STATUS.NOT_FOUND,
          'TICKET_NOT_FOUND',
          `Ticket with ID ${id} not found`
        );
      }

      // Check if ticket is already cancelled or done
      if (ticket.status === 'DONE' || ticket.status === 'CANCELLED') {
        return fail(
          ctx,
          HTTP_STATUS.BAD_REQUEST,
          'TICKET_ALREADY_CLOSED',
          `Cannot cancel a ticket that is already ${ticket.status.toLowerCase()}`
        );
      }

      // Cancel the ticket with optional reason
      const updatedTicket = await service.cancelTicket(
        id,
        cancelData?.reason,
        cancelData?.cancelledBy,
        cancelData?.cancelledByName
      );

      ctx.info(`Ticket ${id} cancelled successfully${cancelData?.reason ? ' with reason: ' + cancelData.reason : ''}`);
      
      return ok(ctx, {
        id: updatedTicket.id,
        status: updatedTicket.status,
        closedAt: updatedTicket.closedAt,
        notes: updatedTicket.notes || [],
        message: 'Ticket cancelled successfully'
      });
    } catch (error: any) {
      ctx.error('Error cancelling ticket:', error);
      return fail(
        ctx,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'CANCEL_ERROR',
        'Failed to cancel ticket',
        error.message
      );
    }
  },
);

app.http('ticket-cancel', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'v1/tickets/{id}/cancel',
  handler: cancelTicketHandler,
});