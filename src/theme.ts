export type Theme = {
    id: string;
    name: string;
    description: string;
    getCss: () => Promise<string>;
};

const themeMeta: Omit<Theme, 'getCss'>[] = [
    {
        id: "default",
        name: "Default",
        description: "A clean, classic layout ideal for long-form reading.",
    },
    {
        id: "orangeheart",
        name: "OrangeHeart",
        description: "A vibrant and elegant theme in warm orange tones.",
    },
    {
        id: "rainbow",
        name: "Rainbow",
        description: "A colorful, lively theme with a clean layout.",
    },
    {
        id: "lapis",
        name: "Lapis",
        description: "A minimal and refreshing theme in cool blue tones.",
    },
    {
        id: "pie",
        name: "Pie",
        description: "Inspired by sspai.com and Misty — modern, sharp, and stylish.",
    },
    {
        id: "maize",
        name: "Maize",
        description: "A crisp, light theme with a soft maize palette.",
    },
    {
        id: "purple",
        name: "Purple",
        description: "Clean and minimalist, with a subtle purple accent.",
    },
    {
        id: "phycat",
        name: "phycat",
        description: "物理猫-薄荷：a mint-green theme with clear structure and hierarchy.",
    },
];

const themeCssModules = import.meta.glob('./themes/*.css', {
    query: '?raw',
    import: 'default'
});

export const themes: Record<string, Theme> = {};

for (const meta of themeMeta) {
    const cssPath = `./themes/${meta.id}.css`;
    const cssModuleLoader = themeCssModules[cssPath];

    if (cssModuleLoader) {
        themes[meta.id] = {
            ...meta,
            getCss: cssModuleLoader as () => Promise<string>,
        };
    } else {
        console.warn(`[Themes] CSS file not found for theme: ${meta.id}`);
    }
}

export function getAllThemes(): Theme[] {
    return Object.values(themes);
}
