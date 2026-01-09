import { normalizeCssLoader } from "./utils.js";

export type Theme = {
    id: string;
    name: string;
    description: string;
    appName: string;
    author: string;
    getCss: () => Promise<string>;
};

const themeMeta: Omit<Theme, "getCss">[] = [
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

// 自动收集 CSS 模块
const themeCssModules = import.meta.glob("./themes/*.css", {
    query: "?raw",
    import: "default",
    eager: true,
});

// 工具函数：根据 meta + CSS loader 生成 Theme
function createTheme(meta: Omit<Theme, "getCss">): Theme | null {
    const cssPath = `./themes/${meta.id}.css`;
    const cssModuleLoader = themeCssModules[cssPath];
    if (!cssModuleLoader) {
        console.warn(`[Themes] CSS file not found for theme: ${meta.id}`);
        return null;
    }
    return {
        ...meta,
        getCss: normalizeCssLoader(cssModuleLoader),
    };
}

// 公众号主题
export const themes: Record<string, Theme> = Object.fromEntries(
    themeMeta
        .map((meta) => createTheme(meta))
        .filter((t): t is Theme => t !== null)
        .map((t) => [t.id, t])
);

// 获取所有公众号主题
export function getAllThemes(): Theme[] {
    return Object.values(themes);
}

// 其他主题
const otherThemeIds = [
    "juejin_default",
    "medium_default",
    "toutiao_default",
    "zhihu_default",
];

export const otherThemes: Record<string, Theme> = Object.fromEntries(
    otherThemeIds.map((id) => [
        id,
        {
            id,
            name: "",
            description: "",
            appName: "",
            author: "",
            getCss: normalizeCssLoader(themeCssModules[`./themes/${id}.css`]),
        },
    ])
);
