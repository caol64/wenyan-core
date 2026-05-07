import { CredentialStorageAdapter, defaultCredential, WenyanCredential } from "../credentialStore.js";
import path from "node:path";
import { configDir, ensureDir, safeReadJson, safeWriteJson } from "../node/utils.js";

export const credentialPath = path.join(configDir, "credential.json");

export class NodeCredentialStorageAdapter implements CredentialStorageAdapter {
    async loadCredential(): Promise<WenyanCredential | null> {
        await ensureDir(configDir);
        return await safeReadJson<WenyanCredential>(credentialPath, defaultCredential);
    }
    async saveCredential(credential: WenyanCredential): Promise<void> {
        await ensureDir(configDir);
        await safeWriteJson(credentialPath, credential);
    }
    async clearCredential(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
