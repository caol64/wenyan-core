import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { ensureDir, safeReadJson, safeWriteJson } from "./utils.js";

export interface WenyanConfig {
    themes?: Record<string, ThemeConfigOptions>;
}

export interface ThemeConfigOptions {
    id: string;
    name?: string;
    description?: string;
    path: string;
}

const defaultConfig: WenyanConfig = {};

export const configDir = process.env.APPDATA
    ? path.join(process.env.APPDATA, "wenyan-md")
    : path.join(os.homedir(), ".config", "wenyan-md");

export const configPath = path.join(configDir, "config.json");

class ConfigStore {
    private config: WenyanConfig = { ...defaultConfig };
    private initPromise: Promise<void>;

    constructor() {
        this.initPromise = this.load();
    }

    private async load() {
        await ensureDir(configDir);
        this.config = await safeReadJson<WenyanConfig>(configPath, defaultConfig);
    }

    private async save() {
        try {
            await ensureDir(configDir);
            await safeWriteJson(configPath, this.config);
        } catch (error) {
            throw new Error(`无法保存配置文件: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async getConfig(): Promise<WenyanConfig> {
        await this.initPromise; // 等待初始化完成
        return this.config;
    }

    async getThemes(): Promise<ThemeConfigOptions[]> {
        await this.initPromise;
        return Object.values(this.config.themes ?? {});
    }

    async getThemeById(themeId: string): Promise<string | undefined> {
        await this.initPromise;
        const themeOption = this.config.themes?.[themeId];
        if (!themeOption) return undefined;

        const absoluteFilePath = path.join(configDir, themeOption.path);

        try {
            return await fs.readFile(absoluteFilePath, "utf-8");
        } catch {
            return undefined;
        }
    }

    async addThemeToConfig(name: string, content: string): Promise<void> {
        await this.initPromise;
        const savedPath = await this.addThemeFile(name, content);

        this.config.themes ??= {};
        this.config.themes[name] = {
            id: name,
            name,
            path: savedPath,
        };

        await this.save();
    }

    async addThemeFile(themeId: string, themeContent: string): Promise<string> {
        const filePath = `themes/${themeId}.css`;
        const absoluteFilePath = path.join(configDir, filePath);

        await ensureDir(path.dirname(absoluteFilePath));
        await fs.writeFile(absoluteFilePath, themeContent, "utf-8");

        return filePath;
    }

    async deleteThemeFromConfig(themeId: string): Promise<void> {
        await this.initPromise;
        const theme = this.config.themes?.[themeId];
        if (!theme) return;

        await this.deleteThemeFile(theme.path);
        delete this.config.themes![themeId];

        await this.save();
    }

    async deleteThemeFile(filePath: string): Promise<void> {
        try {
            await fs.unlink(path.join(configDir, filePath));
        } catch {
            // ignore
        }
    }
}

export const configStore = new ConfigStore();
