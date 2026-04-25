export interface MermaidDiagram {
    id: string;
    code: string;
}

export type MermaidDiagramRenderer = (diagram: MermaidDiagram) => Promise<string>;

export interface MermaidRenderer {
    renderHtml(html: string): Promise<string>;
}

export interface MermaidOptions {
    enabled?: boolean;
    renderer?: MermaidRenderer;
}

export interface MermaidRendererFactoryOptions {
    mermaidConfig?: Record<string, unknown>;
}

const DEFAULT_MERMAID_CONFIG: Record<string, unknown> = {
    htmlLabels: false,
    flowchart: {
        htmlLabels: false,
    },
};

export async function replaceMermaidCodeBlocks(
    root: ParentNode,
    renderDiagram: MermaidDiagramRenderer,
): Promise<boolean> {
    const codeBlocks = Array.from(root.querySelectorAll<HTMLElement>("pre > code.language-mermaid"));

    if (codeBlocks.length === 0) {
        return false;
    }

    const ownerDocument = getOwnerDocument(root);

    for (const [index, codeBlock] of codeBlocks.entries()) {
        const pre = codeBlock.parentElement;
        const parent = pre?.parentElement;

        if (!pre || !parent) {
            continue;
        }

        const code = codeBlock.textContent ?? "";
        const svg = await renderDiagram({
            id: `wenyan-mermaid-${index + 1}`,
            code,
        });
        const figure = ownerDocument.createElement("figure");

        figure.setAttribute("data-wenyan-diagram", "mermaid");
        figure.innerHTML = svg.trim();
        pre.replaceWith(figure);
    }

    return true;
}

export function createBrowserMermaidRenderer(
    options: MermaidRendererFactoryOptions = {},
): MermaidRenderer {
    let mermaidModulePromise: Promise<typeof import("mermaid")> | null = null;

    return {
        async renderHtml(html: string): Promise<string> {
            if (typeof DOMParser === "undefined") {
                throw new Error("当前环境不支持浏览器 Mermaid 渲染");
            }

            const parser = new DOMParser();
            const document = parser.parseFromString(`<body>${html}</body>`, "text/html");
            const root = document.body;
            const mermaid = await getMermaidModule();

            mermaid.initialize(createMermaidConfig(options.mermaidConfig));

            try {
                await replaceMermaidCodeBlocks(root, async ({ id, code }) => {
                    const { svg } = await mermaid.render(id, code);
                    return svg;
                });
            } catch (error) {
                throw createMermaidRenderError(error);
            }

            return root.innerHTML;
        },
    };

    async function getMermaidModule() {
        if (!mermaidModulePromise) {
            mermaidModulePromise = import("mermaid");
        }

        const module = await mermaidModulePromise;
        return module.default;
    }
}

export function createMermaidRenderError(error: unknown): Error {
    const message = error instanceof Error ? error.message : String(error);
    return new Error(`Mermaid 图表渲染失败: ${message}`);
}

export function createMermaidConfig(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    const flowchartOverrides = getRecord(overrides.flowchart);

    return {
        ...DEFAULT_MERMAID_CONFIG,
        startOnLoad: false,
        securityLevel: "strict",
        ...overrides,
        flowchart: {
            ...getRecord(DEFAULT_MERMAID_CONFIG.flowchart),
            ...flowchartOverrides,
        },
    };
}

function getOwnerDocument(root: ParentNode): Document {
    if ("createElement" in root) {
        return root as Document;
    }

    if ("ownerDocument" in root && root.ownerDocument) {
        return root.ownerDocument;
    }

    throw new Error("无法获取 Mermaid 渲染所需的 Document");
}

function getRecord(value: unknown): Record<string, unknown> {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }

    return {};
}
