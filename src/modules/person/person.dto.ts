// src/modules/person/person.dto.ts
import { z } from 'zod';

/** Reusable role enum */
export const RoleEnum = z.enum(['admin', 'user']);
export type Role = z.infer<typeof RoleEnum>;

/** Reference shape you can embed in other docs (e.g., tickets) */
export const PersonRefSchema = z.object({
  id: z.uuid(),
  firstName: z.string().trim().min(1, 'firstName is required'),
  lastName: z.string().trim().min(1, 'lastName is required'),
  email: z.email().optional(),
  role: RoleEnum.optional(),
});
export type PersonRef = z.infer<typeof PersonRefSchema>;

/** Create (POST /people) — no id on input */
export const CreatePersonSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.email().optional(),
  role: RoleEnum.default('user').optional(),
});
export type CreatePersonDto = z.infer<typeof CreatePersonSchema>;

/** Update (PATCH /people/:id) — partial body; id comes from path */
export const UpdatePersonSchema = CreatePersonSchema.partial();
export type UpdatePersonDto = z.infer<typeof UpdatePersonSchema>;

/** Path param for routes like /people/:id */
export const PersonIdParamSchema = z.object({
  id: z.uuid(),
});
export type PersonIdParam = z.infer<typeof PersonIdParamSchema>;

/** List (GET /people) — basic filtering + pagination */
export const ListPersonSchema = z.object({
  q: z.string().trim().optional(), // free-text search (name/email)
  role: RoleEnum.optional(), // filter by role
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  ids: z.array(z.uuid()).optional(), // optional explicit id filter
});
export type ListPeopleQuery = z.infer<typeof ListPersonSchema>;

/** Helper: compact Person -> PersonRef (if you store a full Person doc) */
export const toPersonRef = (p: {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  role?: Role;
}) => ({
  id: p.id,
  firstName: p.firstName,
  lastName: p.lastName,
  email: p.email,
  role: p.role,
});
