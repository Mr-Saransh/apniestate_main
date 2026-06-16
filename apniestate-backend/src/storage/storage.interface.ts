export interface StorageProvider {
  upload(file: Buffer, key: string, mimeType: string): Promise<string>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}
