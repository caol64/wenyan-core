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

    // 2. 处理代码块
    const codeElements = element.querySelectorAll<HTMLElement>("pre code");

    codeElements.forEach((codeEl) => {
        codeEl.innerHTML = codeEl.innerHTML
            .replace(/\n/g, "<br>")
            .replace(/(>[^<]+)|(^[^<]+)/g, (str: string) => str.replace(/\s/g, "&nbsp;"));
    });

    // 3. 列表
    const listElements = element.querySelectorAll<HTMLLIElement>("li");

    listElements.forEach((li) => {
        // ownerDocument 可能为 null (如果元素未挂载)，回退到全局 document
        const doc = element.ownerDocument || document;
        const section = doc.createElement("section");

        // 将 li 的所有子节点移动进 section
        while (li.firstChild) {
            section.appendChild(li.firstChild);
        }
        li.appendChild(section);
    });
}
