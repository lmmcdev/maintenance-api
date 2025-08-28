export interface AttachmentRef {
  id: string; // storage id (blob name, UUID, etc.)
  filename: string;
  contentType: string; // aka mimetype
  size?: number;
  url?: string; // pre-signed URL or CDN link (optional)
  uploadedAt?: string; // ISO
}
