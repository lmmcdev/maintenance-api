import { BlobStorageService } from './blob-storage.service';
import { AttachmentRef } from '../modules/attachment/attachment.dto';

export class FileMigrationService {
  private blobStorageService: BlobStorageService;

  constructor() {
    this.blobStorageService = new BlobStorageService();
  }

  async init() {
    await this.blobStorageService.init();
    return this;
  }

  /**
   * Descarga un archivo legacy y lo re-sube usando la nueva estructura
   */
  async migrateAttachment(
    legacyAttachment: AttachmentRef,
    ticketId: string,
    targetDate?: string,
  ): Promise<AttachmentRef> {
    const uploadDate = targetDate || new Date().toISOString().split('T')[0];

    // Validar que el attachment tenga datos básicos
    if (!legacyAttachment.filename) {
      console.error('Invalid attachment: missing filename', legacyAttachment);
      throw new Error(`Invalid attachment: missing filename`);
    }

    if (!legacyAttachment.url && !legacyAttachment.folderPath) {
      console.error('Invalid attachment: missing url and folderPath', legacyAttachment);
      throw new Error(`Invalid attachment: missing url and folderPath for ${legacyAttachment.filename}`);
    }

    try {
      // 1. Descargar archivo desde la ubicación legacy
      const fileBuffer = await this.downloadLegacyFile(legacyAttachment);

      if (!fileBuffer) {
        throw new Error(`Failed to download legacy file: ${legacyAttachment.filename}`);
      }

      // 2. Generar nuevo ID y metadata
      const newAttachmentId = crypto.randomUUID();
      const now = new Date().toISOString();

      // 3. Corregir contentType si es incorrecto
      const correctContentType = this.getCorrectContentType(
        legacyAttachment.filename,
        legacyAttachment.contentType,
      );

      // 4. Re-subir usando el blob-storage-service con nueva estructura
      const folderPath = `tickets/${uploadDate}`;
      const uploadResult = await this.blobStorageService.uploadFile(
        fileBuffer,
        legacyAttachment.filename,
        correctContentType,
        ticketId,
        newAttachmentId,
        folderPath,
      );

      // 5. Crear nuevo attachment con estructura correcta
      const newAttachment: AttachmentRef = {
        id: newAttachmentId,
        filename: legacyAttachment.filename,
        contentType: correctContentType,
        size: uploadResult.size,
        url: uploadResult.url,
        uploadedAt: now,
        uploadDate: uploadDate,
        folderPath: folderPath,
      };

      // 6. Opcional: Eliminar archivo legacy (comentado por seguridad)
      await this.deleteLegacyFile(legacyAttachment);

      return newAttachment;
    } catch (error) {
      console.error('Error migrating attachment:', error);
      throw new Error(
        `Failed to migrate attachment ${legacyAttachment.filename}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Descarga archivo desde ubicación legacy
   */
  private async downloadLegacyFile(attachment: AttachmentRef): Promise<Buffer | null> {
    const downloadPaths = this.generateDownloadPaths(attachment);

    console.log(
      `Attempting to download ${attachment.filename} from multiple paths:`,
      downloadPaths,
    );

    // Intentar descargar desde múltiples ubicaciones posibles
    for (const { folderPath, filename, description } of downloadPaths) {
      try {
        console.log(`Trying ${description}: ${folderPath}/${filename}`);
        const buffer = await this.blobStorageService.getFile(folderPath, filename);
        if (buffer) {
          console.log(`Successfully downloaded from ${description}`);
          return buffer;
        }
      } catch (error) {
        console.log(
          `Failed to download from ${description}:`,
          error instanceof Error ? error.message : 'Unknown error',
        );
      }
    }

    console.error(`All download attempts failed for: ${attachment.filename}`);
    return null;
  }

  /**
   * Genera múltiples paths posibles donde puede estar el archivo
   */
  private generateDownloadPaths(
    attachment: AttachmentRef,
  ): Array<{ folderPath: string; filename: string; description: string }> {
    const paths: Array<{ folderPath: string; filename: string; description: string }> = [];

    // 1. Path desde URL si existe
    if (attachment.url) {
      const urlParts = attachment.url.split('/maintenance/');
      if (urlParts.length > 1) {
        const urlPath = urlParts[1];
        // Si el path de la URL contiene carpetas
        if (urlPath.includes('/')) {
          const lastSlashIndex = urlPath.lastIndexOf('/');
          const folderFromUrl = urlPath.substring(0, lastSlashIndex);
          const filenameFromUrl = urlPath.substring(lastSlashIndex + 1);
          paths.push({
            folderPath: folderFromUrl,
            filename: decodeURIComponent(filenameFromUrl),
            description: 'URL with folder structure',
          });
        } else {
          // Archivo directamente en /maintenance
          paths.push({
            folderPath: '',
            filename: decodeURIComponent(urlPath),
            description: 'Direct in /maintenance from URL',
          });
        }
      }
    }

    // 2. folderPath del attachment si existe
    if (attachment.folderPath) {
      paths.push({
        folderPath: attachment.folderPath,
        filename: attachment.filename,
        description: 'Using attachment.folderPath',
      });
    }

    // 3. Directo en /maintenance
    paths.push({
      folderPath: '',
      filename: attachment.filename,
      description: 'Direct in /maintenance',
    });

    // 4. Filename con URL encoding por si tiene espacios
    paths.push({
      folderPath: '',
      filename: encodeURIComponent(attachment.filename),
      description: 'URL encoded filename',
    });

    // 5. Si existe uploadDate, probar en tickets/date
    if (attachment.uploadDate) {
      paths.push({
        folderPath: `tickets/${attachment.uploadDate}`,
        filename: attachment.filename,
        description: `tickets/${attachment.uploadDate} folder`,
      });
    }

    // 6. Probar en estructura de fecha actual
    const today = new Date().toISOString().split('T')[0];
    paths.push({
      folderPath: `tickets/${today}`,
      filename: attachment.filename,
      description: `tickets/${today} folder`,
    });

    return paths;
  }

  /**
   * Corrige el contentType basado en la extensión del archivo
   */
  private getCorrectContentType(filename: string, currentContentType: string): string {
    const ext = filename.toLowerCase().split('.').pop();

    switch (ext) {
      case 'mp3':
        return 'audio/mpeg';
      case 'm4a':
        return 'audio/m4a';
      case 'wav':
        return 'audio/wav';
      case 'pdf':
        return 'application/pdf';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xls':
        return 'application/vnd.ms-excel';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'txt':
        return 'text/plain';
      default:
        return currentContentType || 'application/octet-stream';
    }
  }

  /**
   * Elimina archivo legacy (usar con cuidado)
   */
  private async deleteLegacyFile(attachment: AttachmentRef): Promise<boolean> {
    if (!attachment.url) return false;

    try {
      const urlParts = attachment.url.split('/maintenance/');
      if (urlParts.length > 1) {
        const legacyPath = urlParts[1];
        return await this.blobStorageService.deleteFile('', legacyPath);
      }
      return false;
    } catch (error) {
      console.error('Error deleting legacy file:', error);
      return false;
    }
  }

  /**
   * Migra múltiples attachments de un ticket
   */
  async migrateTicketAttachments(
    ticketId: string,
    attachments: AttachmentRef[],
    targetDate?: string,
  ): Promise<AttachmentRef[]> {
    const migratedAttachments: AttachmentRef[] = [];

    for (const attachment of attachments) {
      try {
        const migrated = await this.migrateAttachment(attachment, ticketId, targetDate);
        migratedAttachments.push(migrated);
        console.log(`Successfully migrated: ${attachment.filename}`);
      } catch (error) {
        console.error(`Failed to migrate ${attachment.filename}:`, error);
        // Mantener el attachment original si falla la migración
        migratedAttachments.push(attachment);
      }
    }

    return migratedAttachments;
  }
}
