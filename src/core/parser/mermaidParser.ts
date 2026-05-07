import type { MermaidOptions, MermaidRenderer } from "../mermaid.js";

export interface ResolvedMermaidOptions {
    enabled: boolean;
    renderer?: MermaidRenderer;
}

export function createMermaidParser(options?: boolean | MermaidOptions) {
    const resolvedOptions = resolveMermaidOptions(options);

    return {
        async parser(html: string): Promise<string> {
            if (!resolvedOptions.enabled || !containsMermaidCodeBlock(html)) {
                return html;
            }

            if (!resolvedOptions.renderer) {
                throw new Error("Mermaid 渲染已启用，但未配置 renderer");
            }

            return await resolvedOptions.renderer.renderHtml(html);
        },
    };
}

export function resolveMermaidOptions(options?: boolean | MermaidOptions): ResolvedMermaidOptions {
    if (options === undefined) {
        return { enabled: false };
    }

    if (typeof options === "boolean") {
        return { enabled: options };
    }

    return {
        enabled: options.enabled ?? true,
        renderer: options.renderer,
    };
}

function containsMermaidCodeBlock(html: string): boolean {
    return html.includes("language-mermaid");
}
