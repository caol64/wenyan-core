import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { ensureDir, safeReadJson, safeWriteJson, configDir } from "./utils.js";
import type { CacheData, UploadCacheStorageAdapter } from "../uploadCacheStore.js";

export const cachePath = path.join(configDir, "upload-cache.json");

export class NodeUploadCacheAdapter implements UploadCacheStorageAdapter {
    async loadCache(): Promise<CacheData> {
        await ensureDir(configDir);
        return await safeReadJson<CacheData>(cachePath, {});
    }

    async saveCache(cache: CacheData): Promise<void> {
        await ensureDir(configDir);
        await safeWriteJson(cachePath, cache);
    }

    async clearCache(): Promise<void> {
        try {
            await fs.unlink(cachePath);
        } catch (error: any) {
            // 如果文件本来就不存在 (ENOENT)，则忽略错误
            if (error.code !== "ENOENT") {
                // 如果是其他错误（比如权限不足），则抛出
                throw error;
            }
        }
    }

    async calcHash(buffer: ArrayBuffer): Promise<string> {
        return crypto.createHash("md5").update(Buffer.from(buffer)).digest("hex");
    }
}
