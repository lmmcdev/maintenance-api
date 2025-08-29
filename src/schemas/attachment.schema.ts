import z from 'zod';

export const AttachmentRefSchema = z.object({
  id: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().int().positive().optional(),
  url: z.url().optional(),
  uploadedAt: z.iso.datetime().optional(),
});
export type AttachmentRef = z.infer<typeof AttachmentRefSchema>;
