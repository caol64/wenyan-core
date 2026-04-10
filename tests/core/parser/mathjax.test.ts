import { describe, it, expect } from "vitest";
import { createMathJaxParser } from "../../../src/core/parser/mathjaxParser";

describe("MathJaxRenderer", () => {
    // 实例化一个默认渲染器
    const renderer = createMathJaxParser();

    describe("1. Basic Rendering (Core Functionality)", () => {
        it("should render inline math ($...$) into SVG wrapped in a span", () => {
            const input = "<p>The value is $x = 1$.</p>";
            const output = renderer.parser(input);

            expect(output).toContain("<svg");
            expect(output).toContain('<span class="inline-equation"');
            expect(output).toContain('math="x = 1"');
        });

        it("should render display math ($$...$$) into SVG wrapped in a section", () => {
            const input = "<div>$$E = mc^2$$</div>";
            const output = renderer.parser(input);

            expect(output).toContain("<svg");
            expect(output).toContain('<section class="block-equation"');
            expect(output).toContain('math="E = mc^2"');
        });

        it("should render display math (\\[...\\]) correctly", () => {
            const input = "\\[ \\sum_{i=0}^n i \\]";
            const output = renderer.parser(input);

            expect(output).toContain('<section class="block-equation"');
            expect(output).toContain("<svg");
        });

        it("should handle plain HTML without math without errors", () => {
            const input = "<div>Hello World</div>";
            const output = renderer.parser(input);

            expect(output).toContain("Hello World");
            expect(output).not.toContain("<svg");
        });

        it("should handle complex HTML structures", () => {
            const input = `
                <div class="content">
                    <h1>Title</h1>
                    <p>Equation 1: $a$</p>
                    <ul>
                        <li>Item: $$b$$</li>
                    </ul>
                </div>
            `;
            const output = renderer.parser(input);

            expect(output).toContain('<div class="content">');
            expect(output).toContain("<h1>Title</h1>");
            expect(output).toContain('<span class="inline-equation"');
            expect(output).toContain('<section class="block-equation"');
        });
    });

    describe("2. Edge Cases & Boundary Conditions", () => {
        it("should handle multiple math expressions in a single string", () => {
            const input = "Here is $a$, and here is $b$, ending with $$c$$";
            const output = renderer.parser(input);

            // 检查是否生成了对应数量的容器
            const inlineMatches = output.match(/class="inline-equation"/g) || [];
            const blockMatches = output.match(/class="block-equation"/g) || [];

            expect(inlineMatches.length).toBe(2);
            expect(blockMatches.length).toBe(1);
        });

        it("should gracefully handle HTML reserved characters (<, >, &) inside math", () => {
            // 很多轻量级解析器容易在这里翻车，把 < 解析成 HTML 标签
            const input = "Check $x < y$ and $a > b$ and $x \\& y$";
            const output = renderer.parser(input);

            expect(output).toContain("<svg");
            expect(output).toContain('math="x < y"');
            expect(output).toContain('math="a > b"');
            // 不应该生成非法标签
            expect(output).not.toMatch(/<\s*y>/);
        });

        it("should ignore escaped delimiters (processEscapes: true)", () => {
            const input = "The price is \\$100 and \\$200, but math is $x=1$";
            const output = renderer.parser(input);

            // 被转义的符号应该还原成普通文本，但不生成 SVG
            expect(output).not.toContain('math="100"');
            expect(output).not.toContain('math="200"');
            // 真正的公式应该生成 SVG
            expect(output).toContain('math="x=1"');

            const svgMatches = output.match(/<svg/g) || [];
            expect(svgMatches.length).toBe(1); // 只有一个真正的公式
        });

        it("should correctly handle multi-line display math", () => {
            const input = `$$
                \\begin{aligned}
                a &= 1 \\\\
                b &= 2
                \\end{aligned}
            $$`;
            const output = renderer.parser(input);

            expect(output).toContain("<svg");
            expect(output).toContain('<section class="block-equation"');
            // 检查换行符是否被正确保留到了 math 属性中
            expect(output).toContain("a &= 1");
        });

        it("should safely handle quotes in the math string without breaking HTML attributes", () => {
            // 公式中包含双引号，测试自定义属性 `math="x = \"1\""` 是否被正确转义
            const input = '$f(x) = \\text{"string"}$';
            const output = renderer.parser(input);

            expect(output).toContain("<svg");
            // 适配器通常会将属性里的双引号转义为 &quot;
            expect(output).toContain("&quot;string&quot;");
        });

        it("should gracefully handle invalid or incomplete TeX without throwing exceptions", () => {
            // 非法语法：未闭合的 \frac
            const input = "Invalid math: $\\frac{1}{2}$ and $\\frac{1}{ $";

            expect(() => {
                const output = renderer.parser(input);
                // 确保至少没有崩溃，而且合法的那个公式能正常渲染出来
                expect(output).toContain('math="\\frac{1}{2}"');
            }).not.toThrow();
        });

        it("should handle empty math expressions without crashing", () => {
            const input = "Empty inline $$ and block $$$$";

            expect(() => {
                const output = renderer.parser(input);
                expect(output).toBeDefined();
            }).not.toThrow();
        });
    });

    describe("3. Configuration & Options", () => {
        it("should support custom delimiters via options", () => {
            const customRenderer = createMathJaxParser({
                inlineMath: [["[math]", "[/math]"]],
                displayMath: [["[display]", "[/display]"]],
            });

            const input = "Inline: [math]y = x^2[/math] Block: [display]E = mc^2[/display]";
            const output = customRenderer.parser(input);

            expect(output).toContain('<span class="inline-equation"');
            expect(output).toContain('math="y = x^2"');
            expect(output).toContain('<section class="block-equation"');
            expect(output).toContain('math="E = mc^2"');
        });

        it("should respect fontCache option differences", () => {
            // local: 字体路径直接内联在各个 svg 内部
            const rendererLocal = createMathJaxParser({ fontCache: "local" });
            const outputLocal = rendererLocal.parser("$$a$$ $$b$$");

            // global: 全局生成一个 SVG `<defs>` 标签复用字体路径
            const rendererGlobal = createMathJaxParser({ fontCache: "global" });
            const outputGlobal = rendererGlobal.parser("$$a$$ $$b$$");

            // 预期 local 和 global 生成的字符串结构应该有显著区别
            expect(outputLocal).not.toEqual(outputGlobal);
        });

        it('should prevent "HTML Handler already registered" error when creating multiple instances', () => {
            expect(() => {
                const r1 = createMathJaxParser();
                const r2 = createMathJaxParser();
                const r3 = createMathJaxParser();

                r1.parser("$a$");
                r2.parser("$b$");
                r3.parser("$c$");
            }).not.toThrow();
        });
    });

    it("should match snapshot for standard complex formula", () => {
        const input = `
                <p>Quadratic formula:</p>
                $$ x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} $$
            `;
        const output = renderer.parser(input);
        // 1. HTML 内容保留
        expect(output).toContain("<p>Quadratic formula:</p>");

        // 2. block math
        expect(output).toContain('class="block-equation"');

        // 3. MathJax container 存在
        expect(output).toContain("<mjx-container");
        expect(output).toContain('display="true"');

        // 4. 核心语义：公式本身没变
        expect(output).toContain('math=" x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} "');

        // 5. 至少渲染出 SVG（不关心细节）
        expect(output).toContain("<svg");
    });

    it("should distinguish inline and display delimiters correctly", () => {
        const input = "$a$ $$b$$ $c$";
        const output = renderer.parser(input);

        expect((output.match(/inline-equation/g) || []).length).toBe(2);
        expect((output.match(/block-equation/g) || []).length).toBe(1);
    });

    it("should preserve math order", () => {
        const input = "$a$ then $b$ then $c$";
        const output = renderer.parser(input);

        expect(output.indexOf('math="a"')).toBeLessThan(output.indexOf('math="b"'));

        expect(output.indexOf('math="b"')).toBeLessThan(output.indexOf('math="c"'));
    });

    it("should not process math inside script/style", () => {
        const input = `<script>$a$</script><style>$b$</style>`;
        const output = renderer.parser(input);

        expect(output).not.toContain("<svg");
    });
});
