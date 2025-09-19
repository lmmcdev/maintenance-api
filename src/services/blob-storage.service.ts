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
    folderPath?: string,
  ): Promise<UploadResult> {
    // Use custom folder path or default to date-based structure
    const defaultPath = `tickets/${new Date().toISOString().split('T')[0]}`;
    const blobPath = folderPath || defaultPath;
    const blobName = `${blobPath}/${filename}`;
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

  async deleteFile(folderPath: string, filename: string): Promise<boolean> {
    if (!filename || filename === 'undefined') {
      console.error('Invalid filename provided to deleteFile:', filename);
      return false;
    }

    const blobName = folderPath ? `${folderPath}/${filename}` : filename;
    const blockBlobClient: BlockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    try {
      const deleteResponse = await blockBlobClient.deleteIfExists();
      return deleteResponse.succeeded;
    } catch (error) {
      console.error('Error deleting file from blob storage:', error);
      return false;
    }
  }

  async getFileUrl(folderPath: string, filename: string): Promise<string> {
    if (!filename || filename === 'undefined') {
      throw new Error('Invalid filename provided to getFileUrl');
    }

    const blobName = folderPath ? `${folderPath}/${filename}` : filename;
    const blockBlobClient: BlockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    return blockBlobClient.url;
  }

  async fileExists(folderPath: string, filename: string): Promise<boolean> {
    if (!filename || filename === 'undefined') {
      console.error('Invalid filename provided to fileExists:', filename);
      return false;
    }

    const blobName = folderPath ? `${folderPath}/${filename}` : filename;
    const blockBlobClient: BlockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    try {
      const response = await blockBlobClient.exists();
      return response;
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  }

  async getFile(folderPath: string, filename: string): Promise<Buffer | null> {
    if (!filename || filename === 'undefined') {
      console.error('Invalid filename provided to getFile:', filename);
      return null;
    }

    const blobName = folderPath ? `${folderPath}/${filename}` : filename;
    const blockBlobClient: BlockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    try {
      const downloadResponse = await blockBlobClient.download(0);
      const chunks: Buffer[] = [];
      for await (const chunk of downloadResponse.readableStreamBody!) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      return Buffer.concat(chunks);
    } catch (error) {
      console.error('Error downloading file from blob storage:', error);
      return null;
    }
  }
}
