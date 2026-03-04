import path from "node:path";
import { configDir } from "./configStore.js";
import { ensureDir, safeReadJson, safeWriteJson } from "./utils.js";

export interface MediaInfo {
    media_id: string;
    url: string;
    updated_at?: number;
}

interface CacheData {
    [md5: string]: MediaInfo; // md5 -> media info
}

const cachePath = path.join(configDir, "upload-cache.json");

class UploadCacheStore {
    private cache: CacheData = {};
    private initPromise: Promise<void>;

    constructor() {
        this.initPromise = this.load();
    }

    private async load() {
        await ensureDir(configDir);
        this.cache = await safeReadJson<CacheData>(cachePath, {});
    }

    private async save() {
        try {
            await ensureDir(configDir);
            await safeWriteJson(cachePath, this.cache);
        } catch (error) {
            throw new Error(`无法保存上传缓存: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async get(md5: string): Promise<MediaInfo | undefined> {
        await this.initPromise;
        return this.cache[md5];
    }

    async set(md5: string, mediaId: string, url: string) {
        await this.initPromise;
        this.cache[md5] = { media_id: mediaId, url, updated_at: Date.now() };
        await this.save();
    }
}

export const uploadCacheStore = new UploadCacheStore();
