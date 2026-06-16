import fs from "fs/promises";
import path from "path";
import type { StorageProvider } from "./storage.interface";

export class LocalStorageProvider implements StorageProvider {
  private basePath = process.env.STORAGE_LOCAL_PATH ?? "./uploads";

  async upload(file: Buffer, key: string): Promise<string> {
    const filePath = path.join(this.basePath, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, file);
    return `/uploads/${key}`;
  }

  async delete(key: string): Promise<void> {
    await fs.unlink(path.join(this.basePath, key));
  }

  getUrl(key: string): string {
    return `${process.env.APP_URL}/uploads/${key}`;
  }
}
