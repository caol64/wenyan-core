import { postRenderMermaidDiagrams } from "./mermaidPostRender.js";

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
    postRenderMermaidDiagrams(element);

    // 3. 处理代码块
    const codeElements = element.querySelectorAll<HTMLElement>("pre code");

    codeElements.forEach((codeEl) => {
        codeEl.innerHTML = codeEl.innerHTML
            .replace(/\n/g, "<br>")
            .replace(/(>[^<]+)|(^[^<]+)/g, (str: string) => str.replace(/\s/g, "&nbsp;"));
    });

    // 4. 列表 section 包裹
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

    // 5. 转换嵌套列表（微信兼容）
    // 微信公众号编辑器会将 <ul>/<ol> 直接嵌套在另一个 <ul>/<ol> 内时
    // 添加额外的项目符号或编号。将嵌套列表转换为带文本标记的 <section>
    // 元素，保留视觉层次但避免触发微信的列表渲染。
    const flattenNestedLists = () => {
        let nestedLists = element.querySelectorAll<HTMLUListElement | HTMLOListElement>(
            "li > section > ul, li > section > ol",
        );

        while (nestedLists.length > 0) {
            // 从最深层开始处理（querySelectorAll 按文档序返回，reverse 后最深的先处理）
            Array.from(nestedLists).reverse().forEach((nestedList) => {
                const isOrdered = nestedList.tagName === "OL";
                const doc = element.ownerDocument;
                const items = Array.from(nestedList.children).filter(
                    (child) => child.tagName === "LI",
                );

                const wrapper = doc.createElement("section");
                wrapper.style.marginLeft = "1em";

                items.forEach((item, index) => {
                    const content = item.querySelector("section");
                    const sectionEl = doc.createElement("section");
                    const marker = isOrdered ? `${index + 1}. ` : "• ";
                    sectionEl.innerHTML = marker + (content?.innerHTML ?? item.innerHTML);
                    wrapper.appendChild(sectionEl);
                });

                nestedList.replaceWith(wrapper);
            });

            nestedLists = element.querySelectorAll<HTMLUListElement | HTMLOListElement>(
                "li > section > ul, li > section > ol",
            );
        }
    };

    flattenNestedLists();

    // 6. 设置字体颜色为黑色，防止黑暗模式影响
    element.style.color = "rgb(0, 0, 0)";
    element.style.caretColor = "rgb(0, 0, 0)";
}
