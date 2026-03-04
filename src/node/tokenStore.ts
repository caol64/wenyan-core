import path from "node:path";
import fs from "node:fs/promises";
import { configDir } from "./configStore.js";
import { ensureDir, safeReadJson, safeWriteJson } from "./utils.js";

export const tokenPath = path.join(configDir, "token.json");

export interface TokenCache {
    appid: string;
    accessToken: string;
    expireAt: number;
}

const defaultCache: TokenCache = {
    appid: "",
    accessToken: "",
    expireAt: 0,
};

class TokenStore {
    private cache: TokenCache = { ...defaultCache };
    private initPromise: Promise<void>;

    constructor() {
        this.initPromise = this.load();
    }

    private async load() {
        await ensureDir(configDir);
        this.cache = await safeReadJson<TokenCache>(tokenPath, defaultCache);
    }

    private async save() {
        try {
            await ensureDir(configDir);
            await safeWriteJson(tokenPath, this.cache);
        } catch (error) {
            throw new Error(`无法保存 token: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    isValid(appid: string): boolean {
        const currentTime = Math.floor(Date.now() / 1000); // 当前时间（秒）
        const bufferTime = 600; // 10 分钟缓冲，避免过期前瞬间失效
        const isAppidMatch = this.cache.appid === appid;
        const isNotExpired = this.cache.expireAt > currentTime + bufferTime;

        return isAppidMatch && isNotExpired;
    }

    getToken(appid: string): string | null {
        return this.isValid(appid) ? this.cache.accessToken : null;
    }

    async setToken(appid: string, accessToken: string, expiresIn: number) {
        await this.initPromise;
        this.cache = {
            appid,
            accessToken,
            expireAt: Math.floor(Date.now() / 1000) + expiresIn,
        };

        await this.save();
    }

    async clear() {
        await this.initPromise;
        this.cache = { ...defaultCache };

        try {
            await fs.unlink(tokenPath);
        } catch {
            // 文件不存在/删除失败时，写入默认缓存覆盖
            await this.save();
        }
    }
}

export const tokenStore = new TokenStore();
