import { NotFoundError } from '../../shared';
import { TicketService } from '../ticket/ticket.service';
import { AttachmentRef, AttachmentUploadRequest, AttachmentDeleteRequest } from './attachment.dto';
import { TicketModel } from '../ticket/ticket.model';
import { BlobStorageService } from '../../services/blob-storage.service';

export class AttachmentService {
  private blobStorageService: BlobStorageService;

  constructor(private ticketService: TicketService) {
    this.blobStorageService = new BlobStorageService();
  }

  async init() {
    await this.ticketService.init();
    await this.blobStorageService.init();
    return this;
  }

  async uploadAttachment(
    uploadData: AttachmentUploadRequest,
    fileBuffer: Buffer,
  ): Promise<AttachmentRef> {
    const { ticketId, filename, contentType } = uploadData;

    const ticket = await this.ticketService.getById(ticketId);
    if (!ticket) {
      throw new NotFoundError(`Ticket with ID ${ticketId} not found`);
    }

    const attachmentId = crypto.randomUUID();
    const now = new Date().toISOString();
    const uploadDate = now.split('T')[0]; // YYYY-MM-DD format

    // Upload file to Azure Blob Storage
    const uploadResult = await this.blobStorageService.uploadFile(
      fileBuffer,
      filename,
      contentType,
      ticketId,
      attachmentId,
    );

    const attachment: AttachmentRef = {
      id: attachmentId,
      filename,
      contentType,
      size: uploadResult.size,
      url: uploadResult.url,
      uploadedAt: now,
      uploadDate: uploadDate,
    };

    const updatedAttachments = [...(ticket.attachments || []), attachment];

    await this.ticketService.updateTicket(ticketId, {
      attachments: updatedAttachments,
      updatedAt: now,
    });

    return attachment;
  }

  async deleteAttachment(deleteData: AttachmentDeleteRequest): Promise<boolean> {
    const { ticketId, attachmentId } = deleteData;

    const ticket = await this.ticketService.getById(ticketId);
    if (!ticket) {
      throw new NotFoundError(`Ticket with ID ${ticketId} not found`);
    }

    const attachmentIndex = ticket.attachments.findIndex(att => att.id === attachmentId);
    if (attachmentIndex === -1) {
      throw new NotFoundError(`Attachment with ID ${attachmentId} not found in ticket ${ticketId}`);
    }

    const attachment = ticket.attachments[attachmentIndex];

    // Delete file from Azure Blob Storage
    if (attachment.uploadDate) {
      await this.blobStorageService.deleteFile(attachment.uploadDate, attachment.filename);
    }

    const updatedAttachments = ticket.attachments.filter(att => att.id !== attachmentId);

    await this.ticketService.updateTicket(ticketId, {
      attachments: updatedAttachments,
      updatedAt: new Date().toISOString(),
    });

    return true;
  }

  async getTicketAttachments(ticketId: string, autoMigrate: boolean = true): Promise<AttachmentRef[]> {
    const ticket = await this.ticketService.getById(ticketId);
    if (!ticket) {
      throw new NotFoundError(`Ticket with ID ${ticketId} not found`);
    }

    if (!ticket.attachments?.length) {
      return [];
    }

    // Auto-migrate legacy attachments when accessed
    if (autoMigrate) {
      const hasLegacy = ticket.attachments.some(att =>
        !att.uploadDate || // New structure requires uploadDate
        !att.url?.match(/\/tickets\/\d{4}-\d{2}-\d{2}\//) || // New structure: /tickets/YYYY-MM-DD/
        att.url?.match(/\/maintenance\/[^\/]+\.(pdf|jpg|png|doc|docx)$/i) || // Legacy direct files
        att.id?.includes('=') ||
        (att.filename?.endsWith('.pdf') && att.contentType === 'audio/m4a')
      );

      if (hasLegacy) {
        await this.migrateLegacyAttachmentsForTicket(ticketId);
        // Refetch ticket after migration
        const updatedTicket = await this.ticketService.getById(ticketId);
        return updatedTicket?.attachments || [];
      }
    }

    return ticket.attachments || [];
  }

  async getAttachment(ticketId: string, attachmentId: string): Promise<AttachmentRef> {
    const attachments = await this.getTicketAttachments(ticketId);
    const attachment = attachments.find(att => att.id === attachmentId);

    if (!attachment) {
      throw new NotFoundError(`Attachment with ID ${attachmentId} not found in ticket ${ticketId}`);
    }

    // Ensure URL is current (in case blob URL format changes)
    if (!attachment.url && attachment.uploadDate) {
      attachment.url = await this.blobStorageService.getFileUrl(attachment.uploadDate, attachment.filename);
    }

    return attachment;
  }

  async getAttachmentDownloadUrl(ticketId: string, attachmentId: string): Promise<string> {
    const attachment = await this.getAttachment(ticketId, attachmentId);
    if (!attachment.uploadDate) {
      throw new Error('Upload date not available for attachment');
    }
    return await this.blobStorageService.getFileUrl(attachment.uploadDate, attachment.filename);
  }

  // Helper method to migrate legacy attachments
  async migrateLegacyAttachment(ticketId: string, attachment: AttachmentRef): Promise<AttachmentRef> {
    // Check if this is a legacy attachment (has old URL structure or wrong content type)
    const isLegacy =
      !attachment.uploadDate || // New structure requires uploadDate
      !attachment.url?.match(/\/tickets\/\d{4}-\d{2}-\d{2}\//) || // New structure: /tickets/YYYY-MM-DD/
      attachment.url?.match(/\/maintenance\/[^\/]+\.(pdf|jpg|png|doc|docx)$/i) || // Legacy direct files like /maintenance/scan0050.pdf
      attachment.id?.includes('=') || // base64 encoded
      (attachment.filename?.endsWith('.pdf') && attachment.contentType === 'audio/m4a');

    if (!isLegacy) {
      return attachment;
    }

    // Generate new proper ID if needed
    const newId = attachment.id?.includes('=') ? crypto.randomUUID() : attachment.id;

    // Fix content type based on file extension
    let correctContentType = attachment.contentType;
    if (attachment.filename) {
      const ext = attachment.filename.toLowerCase().split('.').pop();
      switch (ext) {
        case 'pdf':
          correctContentType = 'application/pdf';
          break;
        case 'jpg':
        case 'jpeg':
          correctContentType = 'image/jpeg';
          break;
        case 'png':
          correctContentType = 'image/png';
          break;
        case 'doc':
          correctContentType = 'application/msword';
          break;
        case 'docx':
          correctContentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case 'xls':
          correctContentType = 'application/vnd.ms-excel';
          break;
        case 'xlsx':
          correctContentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        default:
          correctContentType = 'application/octet-stream';
      }
    }

    // Generate new URL with proper structure - use current date for migrated files
    const currentDate = new Date().toISOString().split('T')[0];
    const newUrl = await this.blobStorageService.getFileUrl(currentDate, attachment.filename);

    return {
      ...attachment,
      id: newId,
      contentType: correctContentType,
      url: newUrl,
      uploadDate: currentDate, // Add upload date for migrated files
    };
  }

  // Method to fix all legacy attachments in a ticket
  async migrateLegacyAttachmentsForTicket(ticketId: string): Promise<boolean> {
    const ticket = await this.ticketService.getById(ticketId);
    if (!ticket || !ticket.attachments?.length) {
      return false;
    }

    const migratedAttachments = await Promise.all(
      ticket.attachments.map(attachment => this.migrateLegacyAttachment(ticketId, attachment))
    );

    // Check if any changes were made
    const hasChanges = migratedAttachments.some((migrated, index) =>
      JSON.stringify(migrated) !== JSON.stringify(ticket.attachments[index])
    );

    if (hasChanges) {
      await this.ticketService.updateTicket(ticketId, {
        attachments: migratedAttachments,
        updatedAt: new Date().toISOString(),
      });
      return true;
    }

    return false;
  }
}