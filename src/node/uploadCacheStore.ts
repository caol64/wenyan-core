import fs from "node:fs";
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

    constructor() {
        this.load();
    }

    private load() {
        ensureDir(configDir);

        if (fs.existsSync(cachePath)) {
            this.cache = safeReadJson<CacheData>(cachePath, {});
        }
    }

    private save() {
        try {
            ensureDir(configDir);
            safeWriteJson(cachePath, this.cache);
        } catch (error) {
            console.error("❌ 无法保存上传缓存:", error);
        }
    }

    get(md5: string): MediaInfo {
        return this.cache[md5];
    }

    set(md5: string, mediaId: string, url: string) {
        this.cache[md5] = { media_id: mediaId, url, updated_at: Date.now() };
        this.save();
    }
}

export const uploadCacheStore = new UploadCacheStore();
