import z from "zod";

export const PersonRefSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  role: z.enum(["admin", "user"]),
});
