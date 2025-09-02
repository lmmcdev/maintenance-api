// src/modules/ticket/ticket.status.dto.ts
import { z } from 'zod';
import { TicketStatus } from '../../../shared';

export const UpdateStatusDto = z.object({
  status: z.enum(TicketStatus),
});

export type UpdateStatusDto = z.infer<typeof UpdateStatusDto>;
