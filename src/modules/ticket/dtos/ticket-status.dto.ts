// src/modules/ticket/ticket.status.dto.ts
import { z } from 'zod';
import { TicketStatus } from '../../../shared';

export const UpdateStatusDto = z
  .object({
    status: z
      .string()
      .transform((val) => val.toUpperCase())
      .pipe(z.enum(TicketStatus)),
  })
  .strict();

export type UpdateStatusDto = z.infer<typeof UpdateStatusDto>;
