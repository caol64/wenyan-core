import path from "node:path";
import fs from "node:fs/promises";
import { configDir } from "./configStore.js";
import { ensureDir, safeReadJson, safeWriteJson } from "./utils.js";
import { TokenCache, TokenStorageAdapter, defaultTokenCache } from "../tokenStore.js";

export const tokenPath = path.join(configDir, "token.json");

export class NodeTokenStorageAdapter implements TokenStorageAdapter {
    async loadToken(): Promise<TokenCache | null> {
        await ensureDir(configDir);
        return await safeReadJson<TokenCache>(tokenPath, defaultTokenCache);
    }

    async saveToken(cache: TokenCache): Promise<void> {
        await ensureDir(configDir);
        await safeWriteJson(tokenPath, cache);
    }

    async clearToken(): Promise<void> {
        try {
            await fs.unlink(tokenPath);
        } catch (error: any) {
            // 如果文件本来就不存在 (ENOENT)，则忽略错误
            if (error.code !== "ENOENT") {
                // 如果是其他错误（比如权限不足），则抛出
                throw error;
            }
        }
    }
}
