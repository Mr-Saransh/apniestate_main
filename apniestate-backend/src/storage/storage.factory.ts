import { LocalStorageProvider } from "./local.provider";
import { S3StorageProvider } from "./s3.provider";
import type { StorageProvider } from "./storage.interface";

let instance: StorageProvider;

export function getStorage(): StorageProvider {
  if (!instance) {
    instance = process.env.STORAGE_PROVIDER === "s3"
      ? new S3StorageProvider()
      : new LocalStorageProvider();
  }
  return instance;
}
