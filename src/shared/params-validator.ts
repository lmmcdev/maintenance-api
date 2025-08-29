// src/shared/params-validator.ts
import z from "zod";

export const idParamSchema = z.object({
  id: z.uuid(),
});

export function validateIdParam(
  params: unknown
): asserts params is z.infer<typeof idParamSchema> {
  idParamSchema.parse(params);
}
