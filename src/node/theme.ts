import { getAllGzhThemes } from "../core/theme/themeRegistry.js";
import { configStore } from "./configStore.js";
import { getNormalizeFilePath, readFileContent } from "./utils.js";

export interface ThemeOptions {
    list?: boolean;
    add?: boolean;
    name?: string;
    path?: string;
    rm?: string;
}

export interface ThemeInfo {
    id: string;
    name: string;
    description?: string;
    isBuiltin: boolean;
}

export async function listThemes(): Promise<ThemeInfo[]> {
    const themes = getAllGzhThemes();
    const themeList: ThemeInfo[] = themes.map((theme) => {
        return {
            id: theme.meta.id,
            name: theme.meta.name,
            description: theme.meta.description,
            isBuiltin: true,
        };
    });
    const customThemes = await configStore.getThemes();
    if (customThemes.length > 0) {
        customThemes.forEach((theme) => {
            themeList.push({
                id: theme.id,
                name: theme.id,
                description: theme.description,
                isBuiltin: false,
            });
        });
    }
    return themeList;
}

export async function addTheme(name?: string, path?: string) {
    if (!name || !path) {
        throw new Error("添加主题时必须提供名称(name)和路径(path)");
    }

    if (checkThemeExists(name) || (await checkCustomThemeExists(name))) {
        throw new Error(`主题 "${name}" 已存在`);
    }

    if (path.startsWith("http")) {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`无法从远程获取主题: ${response.statusText}`);
        }
        const content = await response.text();
        await configStore.addThemeToConfig(name, content);
    } else {
        const normalizePath = getNormalizeFilePath(path);
        const content = await readFileContent(normalizePath);
        await configStore.addThemeToConfig(name, content);
    }
}

export async function removeTheme(name: string) {
    if (checkThemeExists(name)) {
        throw new Error(`默认主题 "${name}" 不能删除`);
    }
    if (!(await checkCustomThemeExists(name))) {
        throw new Error(`自定义主题 "${name}" 不存在`);
    }
    await configStore.deleteThemeFromConfig(name);
}

function checkThemeExists(themeId: string): boolean {
    const themes = getAllGzhThemes();
    return themes.some((theme) => theme.meta.id === themeId);
}

async function checkCustomThemeExists(themeId: string): Promise<boolean> {
    const customThemes = await configStore.getThemes();
    return customThemes.some((theme) => theme.id === themeId);
}
