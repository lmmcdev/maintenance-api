// src/schemas/location.schema.ts
import z from "zod";

export const LocationSchema = z.object({
  id: z.uuid(),
  name: z.string().min(2).max(100),
  address: z.string().min(5).max(200),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  zip: z.string().min(5).max(10),
  country: z.string().min(2).max(100),
});

export type Location = z.infer<typeof LocationSchema>;
