import { BlobServiceClient, ContainerClient, BlockBlobClient } from '@azure/storage-blob';
import { env } from '../config/env';

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  contentType: string;
}

export class BlobStorageService {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;

  constructor() {
    if (!env.storage.connectionString) {
      throw new Error('Azure Storage connection string is required');
    }

    this.blobServiceClient = BlobServiceClient.fromConnectionString(env.storage.connectionString);
    this.containerClient = this.blobServiceClient.getContainerClient(env.storage.containerName);
  }

  async init(): Promise<void> {
    try {
      await this.containerClient.createIfNotExists({
        access: 'blob',
      });
    } catch (error) {
      console.error('Failed to initialize blob container:', error);
      throw new Error('Failed to initialize blob storage');
    }
  }

  async uploadFile(
    buffer: Buffer,
    filename: string,
    contentType: string,
    ticketId: string,
    attachmentId: string,
  ): Promise<UploadResult> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const blobName = `tickets/${today}/${filename}`;
    const blockBlobClient: BlockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    try {
      const uploadResponse = await blockBlobClient.upload(buffer, buffer.length, {
        blobHTTPHeaders: {
          blobContentType: contentType,
          blobContentDisposition: `attachment; filename="${filename}"`,
        },
        metadata: {
          ticketId,
          attachmentId,
          originalFilename: filename,
          uploadedAt: new Date().toISOString(),
        },
      });

      if (!uploadResponse.requestId) {
        throw new Error('Failed to upload file to blob storage');
      }

      return {
        url: blockBlobClient.url,
        filename,
        size: buffer.length,
        contentType,
      };
    } catch (error) {
      console.error('Error uploading file to blob storage:', error);
      throw new Error('Failed to upload file to storage');
    }
  }

  async deleteFile(uploadDate: string, filename: string): Promise<boolean> {
    const blobName = `tickets/${uploadDate}/${filename}`;
    const blockBlobClient: BlockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    try {
      const deleteResponse = await blockBlobClient.deleteIfExists();
      return deleteResponse.succeeded;
    } catch (error) {
      console.error('Error deleting file from blob storage:', error);
      return false;
    }
  }

  async getFileUrl(uploadDate: string, filename: string): Promise<string> {
    const blobName = `tickets/${uploadDate}/${filename}`;
    const blockBlobClient: BlockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    return blockBlobClient.url;
  }

  async fileExists(uploadDate: string, filename: string): Promise<boolean> {
    const blobName = `tickets/${uploadDate}/${filename}`;
    const blockBlobClient: BlockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    try {
      const response = await blockBlobClient.exists();
      return response;
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  }
}
