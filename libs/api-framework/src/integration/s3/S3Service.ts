import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

export interface S3Config {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface UploadFileOptions {
  bucket: string;
  key: string;
  file: Buffer | Readable;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface UploadFileResult {
  url: string;
  key: string;
  bucket: string;
}

export interface RetrieveFileOptions {
  bucket: string;
  key: string;
}

export interface RetrieveFileResult {
  file: Buffer;
  contentType?: string;
  metadata?: Record<string, string>;
}

export class S3Service {
  private client: S3Client;
  private readonly region: string;

  constructor(config: S3Config) {
    this.region = config.region;

    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async uploadFile(options: UploadFileOptions): Promise<UploadFileResult> {
    const command = new PutObjectCommand({
      Bucket: options.bucket,
      Key: options.key,
      Body: options.file,
      ContentType: options.contentType,
      Metadata: options.metadata,
    });

    await this.client.send(command);

    const url = `https://${options.bucket}.s3.${this.region}.amazonaws.com/${options.key}`;

    return {
      url,
      key: options.key,
      bucket: options.bucket,
    };
  }

  async retrieveFile(
    options: RetrieveFileOptions,
  ): Promise<RetrieveFileResult> {
    const command = new GetObjectCommand({
      Bucket: options.bucket,
      Key: options.key,
    });

    const response = await this.client.send(command);

    if (!response.Body) {
      throw new Error('File not found or empty');
    }

    const stream = response.Body as Readable;
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }

    const file = Buffer.concat(chunks);

    return {
      file,
      contentType: response.ContentType,
      metadata: response.Metadata,
    };
  }

  async getFileStream(options: RetrieveFileOptions): Promise<Readable> {
    const command = new GetObjectCommand({
      Bucket: options.bucket,
      Key: options.key,
    });

    const response = await this.client.send(command);

    if (!response.Body) {
      throw new Error('File not found or empty');
    }

    return response.Body as Readable;
  }

  async getUploadUrl(
    options: Omit<UploadFileOptions, 'file'>,
    expiresIn: number = 3600,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: options.bucket,
      Key: options.key,
      ContentType: options.contentType,
      Metadata: options.metadata,
    });

    return await getSignedUrl(this.client, command, { expiresIn });
  }

  async getDownloadUrl(
    options: RetrieveFileOptions,
    expiresIn: number = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: options.bucket,
      Key: options.key,
    });

    return await getSignedUrl(this.client, command, { expiresIn });
  }

  async deleteFile(
    options: RetrieveFileOptions,
  ): Promise<{ success: boolean }> {
    const command = new DeleteObjectCommand({
      Bucket: options.bucket,
      Key: options.key,
    });

    await this.client.send(command);

    return { success: true };
  }

  async fileExists(options: RetrieveFileOptions): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: options.bucket,
        Key: options.key,
      });

      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  async getFileMetadata(options: RetrieveFileOptions): Promise<{
    contentType?: string;
    contentLength?: number;
    lastModified?: Date;
    metadata?: Record<string, string>;
  }> {
    const command = new HeadObjectCommand({
      Bucket: options.bucket,
      Key: options.key,
    });

    const response = await this.client.send(command);

    return {
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      lastModified: response.LastModified,
      metadata: response.Metadata,
    };
  }
}
