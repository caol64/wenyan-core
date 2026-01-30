import path from "node:path";
import os from "node:os";
import fs from "node:fs";

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
    ? path.join(process.env.APPDATA, "wenyan-md") // Windows
    : path.join(os.homedir(), ".config", "wenyan-md"); // macOS/Linux

export const configPath = path.join(configDir, "config.json");

class ConfigStore {
    private config: WenyanConfig = { ...defaultConfig };

    constructor() {
        this.load();
    }

    private load() {
        if (fs.existsSync(configPath)) {
            try {
                const fileContent = fs.readFileSync(configPath, "utf-8");
                this.config = { ...defaultConfig, ...JSON.parse(fileContent) };
            } catch (error) {
                console.warn("⚠️ 配置文件解析失败，将使用默认配置");
                this.config = { ...defaultConfig };
            }
        }
    }

    private save() {
        this.mkdirIfNotExists();
        try {
            fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2), "utf-8");
        } catch (error) {
            console.error("❌ 无法保存配置文件:", error);
        }
    }

    private mkdirIfNotExists(dir: string = configDir) {
        try {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        } catch (error) {
            console.error("❌ 无法创建配置目录:", error);
        }
    }

    getConfig(): WenyanConfig {
        return this.config;
    }

    addThemeToConfig(name: string, content: string): void {
        const savedPath = this.addThemeFile(name, content);
        this.config.themes = this.config.themes || {};
        this.config.themes[name] = {
            id: name,
            name: name,
            path: savedPath,
        };
        this.save();
    }

    getThemes(): ThemeConfigOptions[] {
        return this.config.themes ? Object.values(this.config.themes) : [];
    }

    getThemeById(themeId: string): string | undefined {
        const themeOption = this.config.themes ? this.config.themes[themeId] : undefined;
        if (themeOption) {
            const absoluteFilePath = path.join(configDir, themeOption.path);
            if (fs.existsSync(absoluteFilePath)) {
                return fs.readFileSync(absoluteFilePath, "utf-8");
            }
        }
        return undefined;
    }

    addThemeFile(themeId: string, themeContent: string): string {
        const filePath = `themes/${themeId}.css`;
        const absoluteFilePath = path.join(configDir, filePath);
        this.mkdirIfNotExists(path.dirname(absoluteFilePath));
        fs.writeFileSync(absoluteFilePath, themeContent, "utf-8");
        return filePath;
    }

    deleteThemeFromConfig(themeId: string) {
        if (this.config.themes && this.config.themes[themeId]) {
            this.deleteThemeFile(this.config.themes[themeId].path);
            delete this.config.themes[themeId];
            this.save();
        }
    }

    deleteThemeFile(filePath: string) {
        const absoluteFilePath = path.join(configDir, filePath);
        if (fs.existsSync(absoluteFilePath)) {
            fs.unlinkSync(absoluteFilePath);
        }
    }
}

export const configStore = new ConfigStore();
