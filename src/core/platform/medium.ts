/**
 * 获取用于发布到 Medium 的 HTML 内容
 */
export function getContentForMedium(wenyanElement: HTMLElement): string {
    // 1. 处理 Blockquote
    processBlockquotes(wenyanElement);

    // 2. 处理代码块 (Pre/Code)
    processCodeBlocks(wenyanElement);

    // 3. 处理表格 (Table -> ASCII Art)
    processTables(wenyanElement);

    // 4. 处理嵌套列表 (UL/LI)
    // 这里的逻辑是将嵌套列表扁平化为 Medium 友好的文本格式
    const nestedUls = wenyanElement.querySelectorAll<HTMLUListElement>("ul ul");
    nestedUls.forEach((ul) => transformUl(ul));

    // 5. 处理公式 (MathJax)
    processMath(wenyanElement);

    return wenyanElement.outerHTML;
}

/**
 * 转换引用块：将 p 标签转换为 span，并添加换行，适应 Medium 格式
 */
function processBlockquotes(root: HTMLElement): void {
    const paragraphs = root.querySelectorAll<HTMLParagraphElement>("blockquote p");
    const doc = root.ownerDocument;
    paragraphs.forEach((p) => {
        const span = doc.createElement("span");
        // 使用 textContent 性能更好，且防止 XSS（虽然这里是克隆节点）
        span.textContent = (p.textContent || "") + "\n\n";
        p.replaceWith(span);
    });
}

/**
 * 转换代码块：移除高亮标签，提取语言，保留纯文本
 */
function processCodeBlocks(root: HTMLElement): void {
    const preElements = root.querySelectorAll<HTMLPreElement>("pre");

    preElements.forEach((pre) => {
        pre.setAttribute("data-code-block-lang", "none");
        pre.setAttribute("data-code-block-mode", "2");

        const code = pre.querySelector("code");
        if (code) {
            // 1. 提取语言
            let language = "";
            code.classList.forEach((cls) => {
                if (cls.startsWith("language-")) {
                    language = cls.replace("language-", "");
                }
            });

            if (language) {
                pre.setAttribute("data-code-block-lang", language);
            }

            // 2. 扁平化代码内容
            // 优化：直接获取 textContent 即可移除所有语法高亮 span，比遍历 replaceWith 快得多
            const rawCode = code.textContent || "";

            // 3. 处理换行
            // 仅移除首尾多余空白，保留代码内部的空行结构（原代码的 replace(/\n+/g, '\n') 可能会破坏代码格式）
            code.textContent = rawCode.trim();
        }
    });
}

/**
 * 转换表格：将 HTML 表格转换为 ASCII 字符画
 */
function processTables(root: HTMLElement): void {
    const tables = root.querySelectorAll<HTMLTableElement>("table");
    const doc = root.ownerDocument;

    tables.forEach((t) => {
        const pre = doc.createElement("pre");
        const code = doc.createElement("code");
        code.textContent = tableToAsciiArt(t);

        pre.appendChild(code);
        pre.setAttribute("data-code-block-lang", "none");
        pre.setAttribute("data-code-block-mode", "2");
        t.replaceWith(pre);
    });
}

/**
 * 转换公式：还原 MathJax 为 TeX 源码
 */
function processMath(root: HTMLElement): void {
    const mathElements = root.querySelectorAll<HTMLElement>("mjx-container");

    mathElements.forEach((element) => {
        const math = element.getAttribute("math");
        const parent = element.parentElement;
        const doc = element.ownerDocument;

        if (parent && math) {
            element.remove();
            // 使用 textContent 插入 TeX 源码，避免特殊符号被解析为 HTML 标签
            // 如果 Medium 需要特定的 HTML 结构来包裹公式，请在这里调整
            const span = doc.createElement("span");
            span.textContent = math;
            parent.appendChild(span);
        }
    });
}

/**
 * 递归处理嵌套 UL，转换为 Medium 风格的伪列表
 */
function transformUl(ulElement: HTMLUListElement): void {
    // 递归处理子 UL
    const nestedUls = ulElement.querySelectorAll<HTMLUListElement>("ul");
    nestedUls.forEach((nestedUl) => transformUl(nestedUl));

    // 获取所有直接子元素 li
    const children = Array.from(ulElement.children) as HTMLElement[];

    // 构建替换字符串
    const replaceString = children
        .map((item) => {
            // 简单处理：将 li 替换为 "换行 + 破折号 + 内容"
            // 注意：这里使用 outerHTML 可能会包含子 ul 的转换结果
            // 这种正则替换比较脆弱，但在特定场景下（Medium importer）可能有效
            return item.outerHTML
                .replace(/^<li[^>]*>/i, "<br>\n- ") // 替换开头的 <li>
                .replace(/<\/li>$/i, ""); // 移除结尾的 </li>
        })
        .join(" ");

    // 替换整个 ul
    ulElement.outerHTML = replaceString;
}

/**
 * 表格转 ASCII 工具
 */
function tableToAsciiArt(table: HTMLTableElement): string {
    const rowsElements = Array.from(table.querySelectorAll("tr"));

    // 提取数据二维数组
    const rows = rowsElements.map((tr) =>
        Array.from(tr.querySelectorAll("th, td")).map((td) => (td as HTMLElement).innerText.trim()),
    );

    if (rows.length === 0) return "";

    // 优化：计算列宽时考虑中文字符（全角字符）宽度
    const columnWidths = rows[0].map((_, colIndex) =>
        Math.max(...rows.map((row) => getStringWidth(row[colIndex] || ""))),
    );

    // 生成分隔线
    const horizontalLine = "+" + columnWidths.map((width) => "-".repeat(width + 2)).join("+") + "+\n";

    // 格式化每一行
    const formattedRows = rows.map(
        (row) =>
            "| " +
            row
                .map((cell, i) => {
                    const padding = columnWidths[i] - getStringWidth(cell);
                    // 简单的右侧补空格，如果需要更精确的对齐（混合中英文），逻辑会更复杂
                    return cell + " ".repeat(Math.max(0, padding));
                })
                .join(" | ") +
            " |\n",
    );

    let asciiTable = horizontalLine;
    // 表头
    if (formattedRows.length > 0) {
        asciiTable += formattedRows[0];
        asciiTable += horizontalLine;
    }
    // 表内容
    if (formattedRows.length > 1) {
        asciiTable += formattedRows.slice(1).join("");
        asciiTable += horizontalLine;
    }

    return asciiTable;
}

/**
 * 计算字符串视觉宽度（中文字符算 2，其他算 1）
 */
function getStringWidth(str: string): number {
    let width = 0;
    for (let i = 0; i < str.length; i++) {
        // ASCII 范围外通常是宽字符（粗略判断）
        width += str.charCodeAt(i) > 255 ? 2 : 1;
    }
    return width;
}
