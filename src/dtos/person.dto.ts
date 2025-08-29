// src/dtos/person.dto.ts

import { z } from 'zod';

export const PersonSchema = z.object({
  id: z.uuid(),
  name: z.string().min(2).max(100),
  email: z.email(),
  age: z.number().min(0).optional(),
});
