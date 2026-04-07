import path from "node:path";
import { configDir, ensureDir, safeReadJson, safeWriteJson } from "./utils.js";

export interface WenyanCredential {
    wechat?: Record<string, string>;
}

const defaultCredential: WenyanCredential = {};

export const credentialPath = path.join(configDir, "credential.json");

class CredentialStore {
    private credential: WenyanCredential = { ...defaultCredential };
    private initPromise: Promise<void>;

    constructor() {
        this.initPromise = this.load();
    }

    private async load() {
        await ensureDir(configDir);
        this.credential = await safeReadJson<WenyanCredential>(credentialPath, defaultCredential);
    }

    private async save() {
        try {
            await ensureDir(configDir);
            await safeWriteJson(credentialPath, this.credential);
        } catch (error) {
            throw new Error(`无法保存凭据文件: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async _getWechatCredential(): Promise<Record<string, string>> {
        await this.initPromise;
        return this.credential.wechat ?? {};
    }

    async getWechatCredential(appId: string): Promise<{ appId: string; appSecret: string } | undefined> {
        const wechat = await this._getWechatCredential();
        if (!wechat) return undefined;
        const appSecret = wechat[appId];
        if (!appSecret) return undefined;
        return { appId, appSecret };
    }

    async saveWechatCredential(appId: string, appSecret: string): Promise<void> {
        await this.initPromise;
        this.credential.wechat ??= {};
        this.credential.wechat[appId] = appSecret;
        await this.save();
    }

    async deleteWechatCredential(appId: string): Promise<void> {
        await this.initPromise;
        if (this.credential.wechat) {
            delete this.credential.wechat[appId];
            await this.save();
        }
    }

}

export const credentialStore = new CredentialStore();
