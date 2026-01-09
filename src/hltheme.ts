import { normalizeCssLoader } from "./utils.js";

export type HlTheme = {
    id: string;
    getCss: () => Promise<string>;
};

const themeMeta: Omit<HlTheme, "getCss">[] = [
    {
        id: "atom-one-dark",
    },
    {
        id: "atom-one-light",
    },
    {
        id: "dracula",
    },
    {
        id: "github-dark",
    },
    {
        id: "github",
    },
    {
        id: "monokai",
    },
    {
        id: "solarized-dark",
    },
    {
        id: "solarized-light",
    },
    {
        id: "xcode",
    },
];

const themeCssModules = import.meta.glob("./highlight/styles/*.css", {
    query: "?raw",
    import: "default",
    eager: true,
});

export const hlThemes: Record<string, HlTheme> = {};

for (const meta of themeMeta) {
    const cssPath = `./highlight/styles/${meta.id}.min.css`;
    const cssModuleLoader = themeCssModules[cssPath];

    if (cssModuleLoader) {
        hlThemes[meta.id] = {
            ...meta,
            getCss: normalizeCssLoader(cssModuleLoader),
        };
    } else {
        console.warn(`[Highlight Themes] CSS file not found for theme: ${meta.id}`);
    }
}

export function getAllHlThemes(): HlTheme[] {
    return Object.values(hlThemes);
}
