import { CssSource, loadCssBySource, normalizeCssLoader } from "../utils.js";

export interface ThemeMeta {
    id: string;
    name: string;
    description: string;
    appName: string;
    author: string;
}

export interface Theme {
    meta: ThemeMeta;
    getCss(): Promise<string>;
}

const registry = new Map<string, Theme>();

export function registerTheme(theme: Theme) {
    registry.set(theme.meta.id, theme);
}

export function getTheme(id: string): Theme | undefined {
    return registry.get(id);
}

export function getAllThemes(): Theme[] {
    return [...registry.values()];
}

const gzhBuiltInThemeMetas: ThemeMeta[] = [
    {
        id: "default",
        name: "Default",
        description: "A clean, classic layout ideal for long-form reading.",
        appName: "默认",
        author: "",
    },
    {
        id: "orangeheart",
        name: "OrangeHeart",
        description: "A vibrant and elegant theme in warm orange tones.",
        appName: "Orange Heart",
        author: "evgo2017",
    },
    {
        id: "rainbow",
        name: "Rainbow",
        description: "A colorful, lively theme with a clean layout.",
        appName: "Rainbow",
        author: "thezbm",
    },
    {
        id: "lapis",
        name: "Lapis",
        description: "A minimal and refreshing theme in cool blue tones.",
        appName: "Lapis",
        author: "YiNN",
    },
    {
        id: "pie",
        name: "Pie",
        description: "Inspired by sspai.com and Misty — modern, sharp, and stylish.",
        appName: "Pie",
        author: "kevinzhao2233",
    },
    {
        id: "maize",
        name: "Maize",
        description: "A crisp, light theme with a soft maize palette.",
        appName: "Maize",
        author: "BEATREE",
    },
    {
        id: "purple",
        name: "Purple",
        description: "Clean and minimalist, with a subtle purple accent.",
        appName: "Purple",
        author: "hliu202",
    },
    {
        id: "phycat",
        name: "Phycat",
        description: "物理猫-薄荷：a mint-green theme with clear structure and hierarchy.",
        appName: "物理猫-薄荷",
        author: "sumruler",
    },
];

const otherThemeIds = ["juejin_default", "medium_default", "toutiao_default", "zhihu_default"];

const otherBuiltInThemeMetas: ThemeMeta[] = otherThemeIds.map((id) => ({
    id,
    name: "",
    description: "",
    appName: "",
    author: "",
}));

const cssModules = import.meta.glob("/src/assets/themes/*.css", {
    query: "?raw",
    import: "default",
    eager: true,
});

export function registerAllBuiltInThemes() {
    registerBuiltInThemes(gzhBuiltInThemeMetas);
    registerBuiltInThemes(otherBuiltInThemeMetas);
}

function registerBuiltInThemes(themeMetas: ThemeMeta[]) {
    for (const meta of themeMetas) {
        const path = `/src/assets/themes/${meta.id}.css`;
        const loader = cssModules[path];
        if (!loader) continue;

        registerTheme(
            createTheme(meta, {
                type: "asset",
                loader: normalizeCssLoader(loader),
            }),
        );
    }
}

function createTheme(meta: ThemeMeta, source: CssSource): Theme {
    return { meta, getCss: () => loadCssBySource(source) };
}

export function getAllGzhThemes(): Theme[] {
    return getAllThemes().filter((theme) => gzhBuiltInThemeMetas.some((meta) => meta.id === theme.meta.id));
}
