/**
 * 获取处理后的 HTML 内容：将 MathJax 公式转换为内联 SVG 图片
 */
export function getContentForToutiao(wenyanElement: HTMLElement): string {
    const containers = wenyanElement.querySelectorAll<HTMLElement>("mjx-container");
    const doc = wenyanElement.ownerDocument;

    containers.forEach((container) => {
        const svg = container.querySelector<SVGSVGElement>("svg");

        if (!svg) {
            // 如果容器是空的或没有 SVG，直接移除容器或跳过
            return;
        }

        const img = doc.createElement("img");

        // 确保 svg 包含 xmlns，虽然 MathJax 通常有，但为了 SVG 规范性建议检查
        if (!svg.hasAttribute("xmlns")) {
            svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        }
        const encodedSVG = encodeURIComponent(svg.outerHTML);
        img.src = `data:image/svg+xml,${encodedSVG}`;

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
