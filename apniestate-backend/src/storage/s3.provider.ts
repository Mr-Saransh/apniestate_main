import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import type { StorageProvider } from "./storage.interface";

export class S3StorageProvider implements StorageProvider {
  private client = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
  });

  async upload(file: Buffer, key: string, mimeType: string): Promise<string> {
    await this.client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: file,
      ContentType: mimeType,
    }));
    return this.getUrl(key);
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
    }));
  }

  getUrl(key: string): string {
    return `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`;
  }
}
