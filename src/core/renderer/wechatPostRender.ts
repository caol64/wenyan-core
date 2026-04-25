import * as csstree from "css-tree";
import { parseOptions } from "../parser/cssParser.js";

type InlineStyleTarget = HTMLElement | SVGElement;
type MermaidMarkerPosition = "start" | "end";
type Point = {
    x: number;
    y: number;
};

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export function wechatPostRender(element: HTMLElement): void {
    // 1. 处理公式
    const mathElements = element.querySelectorAll<HTMLElement>("mjx-container");

    mathElements.forEach((mathContainer) => {
        // 精确指定 SVG 类型
        const svg = mathContainer.querySelector<SVGSVGElement>("svg");

        // 类型保护：确保 svg 存在
        if (!svg) return;

        // 获取属性，getAttribute 可能返回 null
        svg.style.width = svg.getAttribute("width") || "";
        svg.style.height = svg.getAttribute("height") || "";

        svg.removeAttribute("width");
        svg.removeAttribute("height");

        const parent = mathContainer.parentElement;

        // 类型保护：确保 parent 存在
        if (parent) {
            mathContainer.remove();
            parent.appendChild(svg);

            if (parent.classList.contains("block-equation")) {
                parent.setAttribute("style", "text-align: center; margin-bottom: 1rem;");
            }
        }
    });

    // 2. 处理 Mermaid SVG
    const mermaidSvgs = element.querySelectorAll<SVGSVGElement>('[data-wenyan-diagram="mermaid"] svg');

    mermaidSvgs.forEach((svg) => {
        svg.style.maxWidth = "100%";
        svg.style.height = "auto";
        inlineMermaidSvgStyles(svg);
        flattenMermaidMarkers(svg);
    });

    // 3. 处理代码块
    const codeElements = element.querySelectorAll<HTMLElement>("pre code");

    codeElements.forEach((codeEl) => {
        codeEl.innerHTML = codeEl.innerHTML
            .replace(/\n/g, "<br>")
            .replace(/(>[^<]+)|(^[^<]+)/g, (str: string) => str.replace(/\s/g, "&nbsp;"));
    });

    // 4. 列表
    const listElements = element.querySelectorAll<HTMLLIElement>("li");

    listElements.forEach((li) => {
        const doc = element.ownerDocument;
        const section = doc.createElement("section");

        // 将 li 的所有子节点移动进 section
        while (li.firstChild) {
            section.appendChild(li.firstChild);
        }
        li.appendChild(section);
    });

    // 5. 设置字体颜色为黑色，防止黑暗模式影响
    element.style.color = "rgb(0, 0, 0)";
    element.style.caretColor = "rgb(0, 0, 0)";
}

function inlineMermaidSvgStyles(svg: SVGSVGElement): void {
    const styleElements = Array.from(svg.querySelectorAll("style"));

    styleElements.forEach((styleElement) => {
        applyInlineStylesFromCss(svg, styleElement.textContent ?? "");
        styleElement.remove();
    });
}

function flattenMermaidMarkers(svg: SVGSVGElement): void {
    const convertedMarkerIds = new Set<string>();
    const markedElements = Array.from(svg.querySelectorAll<SVGElement>("[marker-start], [marker-end]"));

    markedElements.forEach((markedElement) => {
        convertMarkerReference(svg, markedElement, "start", convertedMarkerIds);
        convertMarkerReference(svg, markedElement, "end", convertedMarkerIds);
    });

    convertedMarkerIds.forEach((markerId) => {
        findMarkerById(svg, markerId)?.remove();
    });

    svg.querySelectorAll("defs").forEach((defs) => {
        if (!defs.children.length) {
            defs.remove();
        }
    });
}

function convertMarkerReference(
    svg: SVGSVGElement,
    sourceElement: SVGElement,
    position: MermaidMarkerPosition,
    convertedMarkerIds: Set<string>,
): void {
    const markerAttribute = `marker-${position}`;
    const markerValue = sourceElement.getAttribute(markerAttribute);

    if (!markerValue) {
        return;
    }

    const markerId = extractMarkerId(markerValue);

    if (!markerId) {
        return;
    }

    const marker = findMarkerById(svg, markerId);

    if (!marker) {
        return;
    }

    const flattenedMarker = createFlattenedMarker(svg, sourceElement, marker, position);

    if (!flattenedMarker) {
        return;
    }

    sourceElement.parentNode?.appendChild(flattenedMarker);
    sourceElement.removeAttribute(markerAttribute);
    convertedMarkerIds.add(markerId);
}

function createFlattenedMarker(
    svg: SVGSVGElement,
    sourceElement: SVGElement,
    marker: Element,
    position: MermaidMarkerPosition,
): SVGGElement | null {
    const terminalPoints = getTerminalPoints(sourceElement, position);

    if (!terminalPoints) {
        return null;
    }

    const ownerDocument = svg.ownerDocument;
    const markerGroup = ownerDocument.createElementNS(SVG_NAMESPACE, "g");
    const markerStyle = marker.getAttribute("style");
    const angle = getMarkerAngleDegrees(position, terminalPoints.anchor, terminalPoints.reference, marker);

    markerGroup.setAttribute("data-wenyan-marker", position);
    markerGroup.setAttribute("transform", buildMarkerTransform(marker, terminalPoints.anchor, angle, position));

    if (markerStyle) {
        markerGroup.setAttribute("style", markerStyle);
    }

    Array.from(marker.children).forEach((child) => {
        markerGroup.appendChild(child.cloneNode(true));
    });

    return markerGroup;
}

function getTerminalPoints(
    sourceElement: SVGElement,
    position: MermaidMarkerPosition,
): { anchor: Point; reference: Point } | null {
    const points = getEdgePoints(sourceElement);

    if (points.length < 2) {
        return null;
    }

    if (position === "end") {
        const anchor = points.at(-1);
        if (!anchor) {
            return null;
        }

        const reference = findDistinctPoint(points, points.length - 2, -1, anchor);

        return reference ? { anchor, reference } : null;
    }

    const anchor = points[0];
    if (!anchor) {
        return null;
    }

    const reference = findDistinctPoint(points, 1, 1, anchor);

    return reference ? { anchor, reference } : null;
}

function getEdgePoints(sourceElement: SVGElement): Point[] {
    const encodedPoints = sourceElement.getAttribute("data-points");

    if (encodedPoints) {
        const decodedPoints = decodeMermaidPoints(sourceElement, encodedPoints);

        if (decodedPoints.length >= 2) {
            return decodedPoints;
        }
    }

    const polyPoints = sourceElement.getAttribute("points");

    if (polyPoints) {
        return parseCoordinatePairs(polyPoints);
    }

    const pathData = sourceElement.getAttribute("d");

    if (pathData) {
        return parseCoordinatePairs(pathData);
    }

    return [];
}

function decodeMermaidPoints(sourceElement: SVGElement, encodedPoints: string): Point[] {
    const defaultView = sourceElement.ownerDocument.defaultView;

    try {
        const decoded =
            defaultView?.atob?.(encodedPoints) ??
            (typeof atob === "function" ? atob(encodedPoints) : "");
        const parsed = JSON.parse(decoded) as Array<{ x?: number; y?: number }>;

        return parsed
            .filter((point) => typeof point.x === "number" && typeof point.y === "number")
            .map((point) => ({
                x: point.x as number,
                y: point.y as number,
            }));
    } catch {
        return [];
    }
}

function parseCoordinatePairs(value: string): Point[] {
    const matches = Array.from(value.matchAll(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi), (match) => Number(match[0]));
    const points: Point[] = [];

    for (let index = 0; index + 1 < matches.length; index += 2) {
        points.push({
            x: matches[index],
            y: matches[index + 1],
        });
    }

    return points;
}

function findDistinctPoint(points: Point[], startIndex: number, step: number, anchor: Point): Point | null {
    for (let index = startIndex; index >= 0 && index < points.length; index += step) {
        const point = points[index];

        if (!point) {
            continue;
        }

        if (point.x !== anchor.x || point.y !== anchor.y) {
            return point;
        }
    }

    return null;
}

function getMarkerAngleDegrees(
    position: MermaidMarkerPosition,
    anchor: Point,
    reference: Point,
    marker: Element,
): number {
    const baseAngle =
        position === "end"
            ? Math.atan2(anchor.y - reference.y, anchor.x - reference.x)
            : Math.atan2(reference.y - anchor.y, reference.x - anchor.x);
    const orient = marker.getAttribute("orient")?.trim();

    let angle = (baseAngle * 180) / Math.PI;

    if (orient === "auto-start-reverse" && position === "start") {
        angle += 180;
    } else if (orient && orient !== "auto") {
        const offset = Number.parseFloat(orient);

        if (Number.isFinite(offset)) {
            angle += offset;
        }
    }

    return angle;
}

function buildMarkerTransform(
    marker: Element,
    anchor: Point,
    angle: number,
    position: MermaidMarkerPosition,
): string {
    const viewBox = parseViewBox(marker.getAttribute("viewBox"));
    const markerWidth = parseNumericAttribute(marker.getAttribute("markerWidth"), viewBox?.width ?? 1);
    const markerHeight = parseNumericAttribute(marker.getAttribute("markerHeight"), viewBox?.height ?? 1);
    const viewBoxWidth = viewBox?.width ?? markerWidth;
    const viewBoxHeight = viewBox?.height ?? markerHeight;
    const scaleX = viewBoxWidth === 0 ? 1 : markerWidth / viewBoxWidth;
    const scaleY = viewBoxHeight === 0 ? 1 : markerHeight / viewBoxHeight;
    const offsetX = parseNumericAttribute(marker.getAttribute("refX")) + (viewBox?.minX ?? 0);
    const offsetY = parseNumericAttribute(marker.getAttribute("refY")) + (viewBox?.minY ?? 0);
    const adjustedAnchor = adjustMarkerAnchor(anchor, angle, scaleX, viewBox, offsetX, position);

    return [
        `translate(${adjustedAnchor.x} ${adjustedAnchor.y})`,
        `rotate(${angle})`,
        `scale(${scaleX} ${scaleY})`,
        `translate(${-offsetX} ${-offsetY})`,
    ].join(" ");
}

function adjustMarkerAnchor(
    anchor: Point,
    angle: number,
    scaleX: number,
    viewBox: { minX: number; minY: number; width: number; height: number } | null,
    refX: number,
    position: MermaidMarkerPosition,
): Point {
    const minX = viewBox?.minX ?? 0;
    const maxX = viewBox ? viewBox.minX + viewBox.width : refX;
    const overlap = position === "start" ? Math.max(0, refX - minX) : Math.max(0, maxX - refX);

    if (overlap === 0) {
        return anchor;
    }

    const distance = overlap * scaleX;
    const radians = (angle * Math.PI) / 180;
    const direction = position === "start" ? 1 : -1;

    return {
        x: anchor.x + Math.cos(radians) * distance * direction,
        y: anchor.y + Math.sin(radians) * distance * direction,
    };
}

function parseViewBox(viewBoxValue: string | null): { minX: number; minY: number; width: number; height: number } | null {
    if (!viewBoxValue) {
        return null;
    }

    const values = viewBoxValue
        .trim()
        .split(/[\s,]+/)
        .map((value) => Number.parseFloat(value));

    if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) {
        return null;
    }

    return {
        minX: values[0],
        minY: values[1],
        width: values[2],
        height: values[3],
    };
}

function parseNumericAttribute(value: string | null, fallback = 0): number {
    if (!value) {
        return fallback;
    }

    const parsed = Number.parseFloat(value);

    return Number.isFinite(parsed) ? parsed : fallback;
}

function extractMarkerId(markerValue: string): string | null {
    const match = markerValue.match(/url\(#([^)]+)\)/);

    return match?.[1] ?? null;
}

function findMarkerById(svg: SVGSVGElement, markerId: string): Element | undefined {
    return Array.from(svg.querySelectorAll("marker")).find((marker) => marker.getAttribute("id") === markerId);
}

function applyInlineStylesFromCss(svg: SVGSVGElement, cssText: string): void {
    const ast = csstree.parse(cssText, parseOptions);

    csstree.walk(ast, {
        visit: "Rule",
        enter(node) {
            if (node.prelude.type !== "SelectorList") return;

            const declarations = node.block.children.toArray().filter((decl) => decl.type === "Declaration");

            if (declarations.length === 0) return;

            node.prelude.children.forEach((selectorNode) => {
                const selector = csstree.generate(selectorNode).trim();

                if (!selector || selector.includes("::")) return;

                const targets = resolveInlineTargets(svg, selector);

                targets.forEach((target) => {
                    declarations.forEach((decl) => {
                        const value = csstree.generate(decl.value);
                        const priority = decl.important ? "important" : "";

                        target.style.setProperty(decl.property, value, priority);
                    });
                });
            });
        },
    });
}

function resolveInlineTargets(svg: SVGSVGElement, selector: string): InlineStyleTarget[] {
    if (selector === ":root") {
        return [svg];
    }

    if (selector.includes(":")) {
        return [];
    }

    const targets = new Set<InlineStyleTarget>();

    if (svg.matches(selector)) {
        targets.add(svg);
    }

    svg.querySelectorAll(selector).forEach((node) => {
        if (isInlineStyleTarget(node)) {
            targets.add(node);
        }
    });

    return Array.from(targets);
}

function isInlineStyleTarget(node: Element): node is InlineStyleTarget {
    const defaultView = node.ownerDocument.defaultView;

    if (!defaultView) {
        return false;
    }

    return node instanceof defaultView.SVGElement || node instanceof defaultView.HTMLElement;
}
