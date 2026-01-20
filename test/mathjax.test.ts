import { describe, it, expect } from "vitest";
import { createMathJaxParser } from "../src/core/parser/mathjaxParser";

describe("MathJaxRenderer", () => {
    // 实例化一个默认渲染器
    const renderer = createMathJaxParser();

    it("should render inline math ($...$) into SVG wrapped in a span", () => {
        const input = "<p>The value is $x = 1$.</p>";
        const output = renderer.parser(input);

        // 1. 验证是否生成了 SVG
        expect(output).toContain("<svg");

        // 2. 验证自定义容器逻辑 (span.inline-equation)
        expect(output).toContain('<span class="inline-equation"');

        // 3. 验证是否保留了原始 TeX 代码在 math 属性中
        // 注意：MathJax 解析后可能会去掉多余空格，这里匹配核心内容
        expect(output).toContain('math="x = 1"');
    });

    it("should render display math ($$...$$) into SVG wrapped in a section", () => {
        const input = "<div>$$E = mc^2$$</div>";
        const output = renderer.parser(input);

        // 1. 验证是否生成了 SVG
        expect(output).toContain("<svg");

        // 2. 验证自定义容器逻辑 (section.block-equation)
        expect(output).toContain('<section class="block-equation"');

        // 3. 验证 math 属性
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

        // 应该是原样输出或者只改变了格式，但不包含 SVG
        expect(output).toContain("Hello World");
        expect(output).not.toContain("<svg");
    });

    it("should support custom delimiters via options", () => {
        // 创建一个新的渲染器，配置自定义定界符
        const customRenderer = createMathJaxParser({
            inlineMath: [["[math]", "[/math]"]],
        });

        const input = "Value: [math]y = x^2[/math]";
        const output = customRenderer.parser(input);

        expect(output).toContain("<svg");
        expect(output).toContain('class="inline-equation"');
        expect(output).toContain('math="y = x^2"');
    });

    it('should prevent "HTML Handler already registered" error when creating multiple instances', () => {
        // 你的代码中有一个全局变量 htmlHandlerRegistered 来保护
        // 我们尝试多次创建实例，确保不会抛出异常
        expect(() => {
            const r1 = createMathJaxParser();
            const r2 = createMathJaxParser();

            r1.parser("$a$");
            r2.parser("$b$");
        }).not.toThrow();
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

        // 验证结构保持完整，且公式被替换
        expect(output).toContain('<div class="content">');
        expect(output).toContain("<h1>Title</h1>");
        expect(output).toContain('<span class="inline-equation"'); // $a$
        expect(output).toContain('<section class="block-equation"'); // $$b$$
    });

    // 可选：快照测试（Snapshot Testing）
    // 这对于检测 MathJax 版本升级导致的 SVG 输出变化非常有用
    it("should match snapshot for standard formula", () => {
        const input = "$x^2 + y^2 = z^2$";
        const output = renderer.parser(input);
        expect(output).toMatchSnapshot();
    });
});
