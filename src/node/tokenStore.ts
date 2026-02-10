import path from "node:path";
import fs from "node:fs";
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
    private cache: TokenCache = defaultCache;

    constructor() {
        this.load();
    }

    private load() {
        ensureDir(configDir);

        if (fs.existsSync(tokenPath)) {
            this.cache = safeReadJson<TokenCache>(tokenPath, defaultCache);
        }
    }

    private save() {
        try {
            ensureDir(configDir);
            safeWriteJson(tokenPath, this.cache);
        } catch (error) {
            console.error("❌ 无法保存 token:", error);
        }
    }

    isValid(appid: string): boolean {
        if (!this.cache) return false;

        return this.cache.appid === appid && this.cache.expireAt > Date.now() / 1000 + 600;
    }

    getToken(appid: string): string | null {
        return this.isValid(appid) ? this.cache.accessToken : null;
    }

    setToken(appid: string, accessToken: string, expiresIn: number) {
        this.cache = {
            appid,
            accessToken,
            expireAt: Math.floor(Date.now() / 1000) + expiresIn,
        };

        this.save();
    }

    clear() {
        this.cache = defaultCache;

        try {
            if (fs.existsSync(tokenPath)) {
                fs.unlinkSync(tokenPath);
            }
        } catch {
            // ignore
        }
    }
}

export const tokenStore = new TokenStore();
