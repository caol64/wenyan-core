export interface MediaInfo {
    media_id: string;
    url: string;
    updated_at?: number;
}

export interface CacheData {
    [hash: string]: MediaInfo; // hash -> media info
}

export interface UploadCacheStorageAdapter {
    loadCache(): Promise<CacheData>;
    saveCache(cache: CacheData): Promise<void>;
    clearCache(): Promise<void>;
    calcHash(buffer: ArrayBuffer): Promise<string>;
}

export class UploadCacheStore {
    private cache: CacheData = {};
    private adapter: UploadCacheStorageAdapter;
    private initPromise: Promise<void>;
    private _saveQueue: Promise<void> = Promise.resolve();

    constructor(adapter: UploadCacheStorageAdapter) {
        this.adapter = adapter;
        this.initPromise = this.load();
    }

    private async load(): Promise<void> {
        try {
            this.cache = await this.adapter.loadCache();
        } catch (error) {
            throw new Error(`无法加载上传缓存: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private save(): Promise<void> {
        this._saveQueue = this._saveQueue.then(async () => {
            try {
                await this.adapter.saveCache(this.cache);
            } catch (error) {
                throw new Error(`无法保存上传缓存: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
        return this._saveQueue;
    }

    public async waitForInit(): Promise<void> {
        await this.initPromise;
    }

    public async get(hash: string): Promise<MediaInfo | undefined> {
        await this.initPromise;
        return this.cache[hash];
    }

    public async set(hash: string, mediaId: string, url: string): Promise<void> {
        await this.initPromise;

        this.cache[hash] = {
            media_id: mediaId,
            url,
            updated_at: Date.now(),
        };

        await this.save();
    }

    public async clear(): Promise<void> {
        await this.initPromise;
        this.cache = {};
        await this.adapter.clearCache();
    }

    public async calcHash(buffer: ArrayBuffer): Promise<string> {
        return this.adapter.calcHash(buffer);
    }
}
