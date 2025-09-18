import z from 'zod';

export const AttachmentRefSchema = z.object({
  id: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().int().positive().optional(),
  url: z.url().optional(),
  uploadedAt: z.string().optional(),
  uploadDate: z.string().optional(), // YYYY-MM-DD format for blob path (legacy)
  folderPath: z.string().optional(), // Custom folder path in blob storage
});
export type AttachmentRef = z.infer<typeof AttachmentRefSchema>;

export const AttachmentUploadRequestSchema = z.object({
  ticketId: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  folderPath: z.string().optional(), // Custom folder path for blob storage
});
export type AttachmentUploadRequest = z.infer<typeof AttachmentUploadRequestSchema>;

export const AttachmentUploadResponseSchema = z.object({
  success: z.boolean(),
  attachment: AttachmentRefSchema.optional(),
  message: z.string().optional(),
});
export type AttachmentUploadResponse = z.infer<typeof AttachmentUploadResponseSchema>;

export const AttachmentDeleteRequestSchema = z.object({
  ticketId: z.string().min(1),
  attachmentId: z.string().min(1),
});
export type AttachmentDeleteRequest = z.infer<typeof AttachmentDeleteRequestSchema>;
