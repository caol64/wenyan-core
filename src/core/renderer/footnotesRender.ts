export function addFootnotes(element: HTMLElement, listStyle: boolean = false): void {
    const footnotes: Array<[number, string, string]> = [];
    let footnoteIndex = 0;
    const links = element.querySelectorAll<HTMLAnchorElement>("a[href]"); // 获取所有带有 href 的 a 元素
    links.forEach((linkElement) => {
        const title = linkElement.textContent || linkElement.innerText;
        const href = linkElement.getAttribute("href") || "";

        // 添加脚注并获取脚注编号
        footnotes.push([++footnoteIndex, title, href]);

        // 在链接后插入脚注标记
        const footnoteMarker = element.ownerDocument.createElement("sup");
        footnoteMarker.setAttribute("class", "footnote");
        footnoteMarker.innerHTML = `[${footnoteIndex}]`;
        linkElement.after(footnoteMarker);
    });
    if (footnoteIndex === 0) return;

    const footnotesHtml = listStyle ? renderListStyleFootnotes(footnotes) : renderParagraphStyleFootnotes(footnotes);

    element.insertAdjacentHTML("beforeend", footnotesHtml);
}

function renderParagraphStyleFootnotes(footnotes: Array<[number, string, string]>): string {
    const items = footnotes.map(([index, title, href]) => {
        if (title === href) {
            return `<p><span class="footnote-num">[${index}]</span><span class="footnote-txt"><i>${title}</i></span></p>`;
        }
        return `<p><span class="footnote-num">[${index}]</span><span class="footnote-txt">${title}: <i>${href}</i></span></p>`;
    });

    return `<h3>引用链接</h3><section id="footnotes">${items.join("")}</section>`;
}

function renderListStyleFootnotes(footnotes: Array<[number, string, string]>): string {
    const items = footnotes.map(([index, title, href]) => {
        if (title === href) {
            return `<li id="footnote-${index}">[${index}]: <i>${title}</i></li>`;
        }
        return `<li id="footnote-${index}">[${index}] ${title}: <i>${href}</i></li>`;
    });

    return `<h3>引用链接</h3><div id="footnotes"><ul>${items.join("")}</ul></div>`;
}
