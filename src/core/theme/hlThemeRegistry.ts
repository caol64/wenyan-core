import { CssSource, loadCssBySource, normalizeCssLoader } from "../utils.js";

export interface HlTheme {
    id: string;
    getCss(): Promise<string>;
}

const registry = new Map<string, HlTheme>();

export function registerHlTheme(theme: HlTheme) {
    registry.set(theme.id, theme);
}

export function getHlTheme(id: string): HlTheme | undefined {
    return registry.get(id);
}

export function getAllHlThemes(): HlTheme[] {
    return [...registry.values()];
}

const hlThemeIds = [
    "atom-one-dark",
    "atom-one-light",
    "dracula",
    "github-dark",
    "github",
    "monokai",
    "solarized-dark",
    "solarized-light",
    "xcode",
];

const cssModules = import.meta.glob("/src/assets/highlight/styles/*.css", {
    query: "?raw",
    import: "default",
    eager: true,
});

export function registerBuiltInHlThemes() {
    for (const id of hlThemeIds) {
        const path = `/src/assets/highlight/styles/${id}.min.css`;
        const loader = cssModules[path];
        if (!loader) continue;

        registerHlTheme(
            createTheme(id, {
                type: "asset",
                loader: normalizeCssLoader(loader),
            }),
        );
    }
}

function createTheme(id: string, source: CssSource): HlTheme {
    return { id, getCss: () => loadCssBySource(source) };
}
