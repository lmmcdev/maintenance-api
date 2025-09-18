// src/shared/params-validator.ts
import z from "zod";

export const idParamSchema = z.object({
  id: z.uuid(),
});

export const ticketAttachmentParamSchema = z.object({
  ticketId: z.string().min(1),
  attachmentId: z.string().min(1),
});

export const ticketParamSchema = z.object({
  ticketId: z.string().min(1),
});

export function validateIdParam(
  params: unknown
): asserts params is z.infer<typeof idParamSchema> {
  idParamSchema.parse(params);
}
