import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, created, fail, ticketParamSchema } from '../../../shared';
import { requireAuth, requireGroups, withMiddleware } from '../../../middleware';
import { env } from '../../../config/env';
import { AttachmentService } from '../attachment.service';
import { TicketService } from '../../ticket/ticket.service';
import { TicketRepository } from '../../ticket/ticket.repository';
import { AttachmentUploadRequest, AttachmentUploadRequestSchema } from '../attachment.dto';
import { AttachmentRoutes } from './index';
import { HTTP_STATUS } from '../../../shared/status-code';
import busboy from 'busboy';
import { Readable } from 'stream';

interface ParsedFile {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

async function parseMultipartForm(req: HttpRequest): Promise<{ fields: Record<string, string>, files: ParsedFile[] }> {
  return new Promise(async (resolve, reject) => {
    const fields: Record<string, string> = {};
    const files: ParsedFile[] = [];

    const contentType = req.headers.get('content-type') || '';

    if (!contentType.includes('multipart/form-data')) {
      reject(new Error('Content-Type must be multipart/form-data'));
      return;
    }

    const bb = busboy({ headers: { 'content-type': contentType } });

    bb.on('field', (name, value) => {
      fields[name] = value;
    });

    bb.on('file', (_, file, info) => {
      const { filename, mimeType } = info;
      const chunks: Buffer[] = [];

      file.on('data', (chunk) => {
        chunks.push(chunk);
      });

      file.on('end', () => {
        files.push({
          buffer: Buffer.concat(chunks),
          filename: filename || 'unknown',
          contentType: mimeType || 'application/octet-stream'
        });
      });
    });

    bb.on('finish', () => {
      resolve({ fields, files });
    });

    bb.on('error', (err) => {
      reject(err);
    });

    try {
      // Use arrayBuffer() method which should handle both ArrayBuffer and ReadableStream
      const arrayBuffer = await req.arrayBuffer();
      const bodyBuffer = Buffer.from(arrayBuffer);
      const stream = Readable.from(bodyBuffer);
      stream.pipe(bb);
    } catch (error) {
      reject(error);
    }
  });
}

const uploadAttachmentHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { ticketId } = ticketParamSchema.parse(req.params);

    if (!req.body) {
      return fail(ctx, HTTP_STATUS.BAD_REQUEST, 'MISSING_FILE', 'No file data provided');
    }

    const contentType = req.headers.get('content-type') || '';

    try {
      let fileBuffer: Buffer;
      let filename: string;
      let fileContentType: string;

      if (contentType.includes('multipart/form-data')) {
        // Handle FormData uploads
        const { fields, files } = await parseMultipartForm(req);

        if (files.length === 0) {
          return fail(ctx, HTTP_STATUS.BAD_REQUEST, 'NO_FILE_UPLOADED', 'No file was uploaded');
        }

        const file = files[0];
        filename = fields.filename || file.filename;
        fileContentType = fields.contentType || file.contentType;
        fileBuffer = file.buffer;

      } else {
        // Handle binary uploads (like your curl command)
        const arrayBuffer = await req.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);

        // Get filename from query parameter or generate one
        filename = req.query.get('filename') || `attachment-${Date.now()}`;

        // Use the Content-Type header or derive from filename
        fileContentType = contentType || getContentTypeFromFilename(filename);

        // If no extension in filename and we have a content type, add extension
        if (!filename.includes('.') && fileContentType !== 'application/octet-stream') {
          const extension = getExtensionFromContentType(fileContentType);
          if (extension) {
            filename += extension;
          }
        }
      }

      if (!filename) {
        return fail(ctx, HTTP_STATUS.BAD_REQUEST, 'MISSING_FILENAME', 'Filename is required');
      }

      if (fileBuffer.length === 0) {
        return fail(ctx, HTTP_STATUS.BAD_REQUEST, 'EMPTY_FILE', 'File is empty');
      }

      const uploadRequest: AttachmentUploadRequest = {
        ticketId,
        filename,
        contentType: fileContentType,
      };

      const validatedRequest = AttachmentUploadRequestSchema.parse(uploadRequest);

      const ticketService = new TicketService(new TicketRepository());
      const attachmentService = new AttachmentService(ticketService);
      await attachmentService.init();

      const attachment = await attachmentService.uploadAttachment(validatedRequest, fileBuffer);

      ctx.info(`Attachment uploaded for ticket ${ticketId}: ${attachment.filename} (${attachment.size} bytes)`);
      return created(ctx, { success: true, attachment });

    } catch (error) {
      ctx.error('Error processing file upload:', error);
      return fail(
        ctx,
        HTTP_STATUS.BAD_REQUEST,
        'UPLOAD_ERROR',
        error instanceof Error ? error.message : 'Failed to process file upload'
      );
    }
  },
);

// Helper functions for content type detection
function getContentTypeFromFilename(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'gif': return 'image/gif';
    case 'doc': return 'application/msword';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls': return 'application/vnd.ms-excel';
    case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'txt': return 'text/plain';
    case 'csv': return 'text/csv';
    default: return 'application/octet-stream';
  }
}

function getExtensionFromContentType(contentType: string): string | null {
  switch (contentType) {
    case 'application/pdf': return '.pdf';
    case 'image/jpeg': return '.jpg';
    case 'image/png': return '.png';
    case 'image/gif': return '.gif';
    case 'application/msword': return '.doc';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': return '.docx';
    case 'application/vnd.ms-excel': return '.xls';
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': return '.xlsx';
    case 'text/plain': return '.txt';
    case 'text/csv': return '.csv';
    default: return null;
  }
}

const handler = withMiddleware(
  [requireGroups([env.groups.maintenance]), requireAuth()],
  uploadAttachmentHandler,
);

app.http('attachment-upload', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: AttachmentRoutes.upload,
  handler,
});