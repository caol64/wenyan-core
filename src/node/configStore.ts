import path from "node:path";
import os from "node:os";
import fs from "node:fs";
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

    constructor() {
        this.load();
    }

    private load() {
        ensureDir(configDir);

        if (fs.existsSync(configPath)) {
            this.config = {
                ...defaultConfig,
                ...safeReadJson<WenyanConfig>(configPath, defaultConfig),
            };
        }
    }

    private save() {
        try {
            ensureDir(configDir);
            safeWriteJson(configPath, this.config);
        } catch (error) {
            console.error("❌ 无法保存配置文件:", error);
        }
    }

    getConfig(): WenyanConfig {
        return this.config;
    }

    getThemes(): ThemeConfigOptions[] {
        return Object.values(this.config.themes ?? {});
    }

    getThemeById(themeId: string): string | undefined {
        const themeOption = this.config.themes?.[themeId];
        if (!themeOption) return;

        const absoluteFilePath = path.join(configDir, themeOption.path);

        try {
            return fs.readFileSync(absoluteFilePath, "utf-8");
        } catch {
            return undefined;
        }
    }

    addThemeToConfig(name: string, content: string): void {
        const savedPath = this.addThemeFile(name, content);

        this.config.themes ??= {};
        this.config.themes[name] = {
            id: name,
            name,
            path: savedPath,
        };

        this.save();
    }

    addThemeFile(themeId: string, themeContent: string): string {
        const filePath = `themes/${themeId}.css`;
        const absoluteFilePath = path.join(configDir, filePath);

        ensureDir(path.dirname(absoluteFilePath));
        fs.writeFileSync(absoluteFilePath, themeContent, "utf-8");

        return filePath;
    }

    deleteThemeFromConfig(themeId: string) {
        const theme = this.config.themes?.[themeId];
        if (!theme) return;

        this.deleteThemeFile(theme.path);
        delete this.config.themes![themeId];

        this.save();
    }

    deleteThemeFile(filePath: string) {
        try {
            fs.unlinkSync(path.join(configDir, filePath));
        } catch {
            // ignore
        }
    }
}

export const configStore = new ConfigStore();
