import { postRenderMermaidDiagrams } from "../renderer/mermaidPostRender.js";
import { createSvgDataUrl } from "../utils.js";

/**
 * 获取处理后的 HTML 内容：将 MathJax 公式转换为内联 SVG 图片
 */
export function getContentForToutiao(wenyanElement: HTMLElement): string {
    postRenderMermaidDiagrams(wenyanElement);
    processMermaid(wenyanElement);

    const containers = wenyanElement.querySelectorAll<HTMLElement>("mjx-container");
    const doc = wenyanElement.ownerDocument;

    containers.forEach((container) => {
        const svg = container.querySelector<SVGSVGElement>("svg");

        if (!svg) {
            // 如果容器是空的或没有 SVG，直接移除容器或跳过
            return;
        }

        const img = doc.createElement("img");

        img.src = createSvgDataUrl(svg);

        // MathJax 的 SVG 通常带有 vertical-align 样式用于行内对齐，需要复制给 img
        // 同时也尝试保留无障碍标签
        const style = svg.getAttribute("style");
        if (style) {
            img.setAttribute("style", style);
        } else {
            // 默认对齐兜底
            img.style.verticalAlign = "middle";
        }

        const ariaLabel = container.getAttribute("aria-label") || container.getAttribute("title");
        if (ariaLabel) {
            img.alt = ariaLabel;
        }

        container.replaceWith(img);
    });

    return wenyanElement.outerHTML;
}

function processMermaid(root: HTMLElement): void {
    const figures = root.querySelectorAll<HTMLElement>('[data-wenyan-diagram="mermaid"]');
    const doc = root.ownerDocument;

    figures.forEach((figure) => {
        const svg = figure.querySelector<SVGSVGElement>("svg");

        if (!svg) {
            return;
        }

        // --- 关键注入点开始 ---
        // 1. 先把 SVG DOM 转成字符串
        let svgString = svg.outerHTML;

        // 2. 使用你的修复函数处理字符串（修复 em 单位和居中问题）
        svgString = fixMermaidSvgForServerRender(svgString);

        // 3. 生成基于修复后字符串的 Data URL
        const img = doc.createElement("img");
        // 注意：这里需要确保 createSvgDataUrl 能接受字符串，
        // 如果它只接受 DOM，你可以临时创建一个 div 把 svgString 转回 DOM，
        // 或者直接在这里手动转 base64
        const encodedData = btoa(unescape(encodeURIComponent(svgString)));
        img.src = `data:image/svg+xml;base64,${encodedData}`;
        // --- 关键注入点结束 ---

        const style = svg.getAttribute("style");
        if (style) {
            img.setAttribute("style", style);
        }

        const ariaLabel =
            figure.getAttribute("aria-label") ||
            figure.getAttribute("title") ||
            svg.getAttribute("aria-label") ||
            svg.getAttribute("title");

        if (ariaLabel) {
            img.alt = ariaLabel;
        }

        figure.replaceWith(img);
    });
}

function fixMermaidSvgForServerRender(svgString: string): string {
    const baseFontSize = 16;
    let fixedSvg = svgString;

    // 1. 将所有的 em 转换为 px
    fixedSvg = fixedSvg.replace(/([xy]|dx|dy)="([-0-9.]+)em"/g, (_, attr, val) => {
        const pxValue = parseFloat(val) * baseFontSize;
        return `${attr}="${pxValue}px"`;
    });

    // 2. 压平导致横向重叠的内部 <tspan>
    // 逻辑：匹配所有不包含 x= 或 y= 属性的 <tspan> 标签，将其首尾标签删掉，仅保留文字
    // 使用 do-while 循环确保多层嵌套被彻底剥离
    let previousSvg;
    do {
        previousSvg = fixedSvg;
        // (?![^>]*\b[xy]=) 确保这个标签内没有 x= 或 y=
        fixedSvg = fixedSvg.replace(/<tspan(?![^>]*\b[xy]=)[^>]*>([\s\S]*?)<\/tspan>/g, '$1');
    } while (fixedSvg !== previousSvg);

    // 3. 解决 librsvg 纵向偏移 BUG (合并 y 和 dy)
    fixedSvg = fixedSvg.replace(/<tspan([^>]+)>/g, (match, attrs) => {
        const yMatch = attrs.match(/y="([-0-9.]+)(?:px)?"/);
        const dyMatch = attrs.match(/dy="([-0-9.]+)(?:px)?"/);

        // 如果同时存在 y 和 dy，合并为绝对的 y
        if (yMatch && dyMatch) {
            const yVal = parseFloat(yMatch[1]);
            const dyVal = parseFloat(dyMatch[1]);
            const finalY = yVal + dyVal;

            let newAttrs = attrs
                .replace(/y="[-0-9.]+(?:px)?"\s*/, '')
                .replace(/dy="[-0-9.]+(?:px)?"\s*/, '');

            return `<tspan ${newAttrs.trim()} y="${finalY}">`;
        }
        return match;
    });

    // 4. 清理冗余的类名，让代码更干净
    fixedSvg = fixedSvg.replace(/class="([^"]*?)text-inner-tspan([^"]*?)"/g, 'class="$1$2"');
    fixedSvg = fixedSvg.replace(/\sclass=""/g, '');

    return fixedSvg;
}
