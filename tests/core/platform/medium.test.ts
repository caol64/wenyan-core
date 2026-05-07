import { describe, it, expect, beforeEach } from "vitest";
import { JSDOM } from "jsdom";
import { getContentForMedium } from "../../../src/core/platform/medium";

describe("platform/medium", () => {
    let dom: JSDOM;
    let document: Document;

    beforeEach(() => {
        // 每个测试前初始化一个干净的 DOM 环境
        dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>');
        document = dom.window.document;
    });

    describe("getContentForMedium", () => {
        it("应该将 blockquote 中的 p 标签转换为带有换行的 span", () => {
            const root = document.getElementById("root")!;
            root.innerHTML = `<blockquote><p>Quote text</p></blockquote>`;

            const result = getContentForMedium(root);

            // 验证 p 是否被替换为 span，且包含两个换行
            expect(result).toContain("<span>Quote text\n\n</span>");
            expect(result).not.toContain("<p>");
        });

        it("应该转换代码块并提取语言信息", () => {
            const root = document.getElementById("root")!;
            root.innerHTML = `
                <pre><code class="language-typescript">const x: number = 1;</code></pre>
            `;

            const result = getContentForMedium(root);

            // 验证 pre 属性
            expect(result).toContain('data-code-block-lang="typescript"');
            expect(result).toContain('data-code-block-mode="2"');
            // 验证 code 内容是否被 trim
            expect(result).toContain("const x: number = 1;");
        });

        it("应该将表格转换为 ASCII 艺术画", () => {
            const root = document.getElementById("root")!;
            root.innerHTML = `
                <table>
                    <tr><th>H1</th><th>H2</th></tr>
                    <tr><td>C1</td><td>C2</td></tr>
                </table>
            `;

            const result = getContentForMedium(root);

            // 验证表格被替换为了 pre > code 结构
            expect(result).toContain("<pre");
            expect(result).toContain("<code");
            expect(result).not.toContain("<table>");
            // 验证 ASCII 艺术画特征字符
            expect(result).toContain("+----+----+");
            expect(result).toContain("| H1 | H2 |");
        });

        it("应该还原 MathJax 公式为 TeX 源码", () => {
            const root = document.getElementById("root")!;
            root.innerHTML = `
                <div>
                    <mjx-container math="E = mc^2"></mjx-container>
                </div>
            `;

            const result = getContentForMedium(root);

            // 验证 mjx-container 被移除，替换为包含源码的 span
            expect(result).not.toContain("mjx-container");
            expect(result).toContain("<span>E = mc^2</span>");
        });

        it("应该将嵌套列表扁平化为 Medium 风格的文本", () => {
            const root = document.getElementById("root")!;
            // 注意：你的 transformUl 逻辑依赖 outerHTML 替换，这种结构最适合真 DOM 测试
            root.innerHTML = `
                <ul>
                    <li>Item 1
                        <ul>
                            <li>Sub Item A</li>
                        </ul>
                    </li>
                </ul>
            `;

            const result = getContentForMedium(root);

            // 验证转换后的破折号风格
            expect(result).toContain("- Sub Item A");
            expect(result).toContain("<br>");
        });

        it("应该正确处理中文字符的表格宽度", () => {
            const root = document.getElementById("root")!;
            root.innerHTML = `
                <table>
                    <tr><td>中文</td><td>abc</td></tr>
                </table>
            `;

            getContentForMedium(root);
            const ascii = root.querySelector("code")?.textContent || "";

            // "中文" 长度为 2，但视觉宽度应为 4
            // 检查分隔线长度（+ 2(padding) + 4(width) + 2(padding) + ...）
            expect(ascii).toContain("+------+-----+");
        });
    });
});
