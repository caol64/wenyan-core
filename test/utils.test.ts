import { describe, it, expect } from "vitest";
import { normalizeCssLoader, stringToMap, replaceCSSVariables, sansSerif, monospace } from "../src/core/utils";

describe("utils", () => {
    describe("normalizeCssLoader", () => {
        it("should wrap a string into a function returning a Promise", async () => {
            const cssContent = ".class { color: red; }";
            const loader = normalizeCssLoader(cssContent);

            expect(typeof loader).toBe("function");
            const result = await loader();
            expect(result).toBe(cssContent);
        });

        it("should return the function as is if input is already a function", async () => {
            const cssContent = ".class { color: blue; }";
            const asyncLoader = () => Promise.resolve(cssContent);
            const loader = normalizeCssLoader(asyncLoader);

            expect(loader).toBe(asyncLoader);
            const result = await loader();
            expect(result).toBe(cssContent);
        });
    });

    describe("stringToMap", () => {
        it("should parse basic key-value pairs", () => {
            const input = "width=100 height=200";
            const map = stringToMap(input);

            expect(map.size).toBe(2);
            expect(map.get("width")).toBe("100");
            expect(map.get("height")).toBe("200");
        });

        it("should remove double quotes", () => {
            const input = 'title="HelloWorld"';
            const map = stringToMap(input);
            expect(map.get("title")).toBe("HelloWorld");
        });

        it("should remove single quotes", () => {
            const input = "font='Arial'";
            const map = stringToMap(input);
            expect(map.get("font")).toBe("Arial");
        });

        it("should handle mixed whitespace", () => {
            const input = 'a=1   b="2" \n c=3';
            const map = stringToMap(input);
            expect(map.get("a")).toBe("1");
            expect(map.get("b")).toBe("2");
            expect(map.get("c")).toBe("3");
        });

        it('should ignore malformed pairs without "="', () => {
            const input = "width=100 invalid height=200";
            const map = stringToMap(input);
            expect(map.has("width")).toBe(true);
            expect(map.has("height")).toBe(true);
            expect(map.has("invalid")).toBe(false);
        });
    });

    describe("replaceCSSVariables", () => {
        it("should replace simple variables", () => {
            const css = `
                :root { --main-color: #ff0000; }
                body { color: var(--main-color); }
            `;
            const result = replaceCSSVariables(css);
            // :root 应该被移除，变量应该被替换
            expect(result).not.toContain(":root");
            expect(result).toContain("body { color: #ff0000; }");
        });

        it("should handle nested/recursive variables", () => {
            const css = `
                :root {
                    --base-size: 16px;
                    --font-size: var(--base-size);
                }
                p { font-size: var(--font-size); }
            `;
            const result = replaceCSSVariables(css);
            expect(result).toContain("p { font-size: 16px; }");
        });

        it("should use default values for missing fonts", () => {
            const css = `
                body {
                    font-family: var(--sans-serif-font);
                    code { font-family: var(--monospace-font); }
                }
            `;
            const result = replaceCSSVariables(css);
            expect(result).toContain(`font-family: ${sansSerif}`);
            expect(result).toContain(`font-family: ${monospace}`);
        });

        it("should allow overriding default fonts", () => {
            const customSans = '"My Custom Font", sans-serif';
            const css = `
                :root { --sans-serif-font: ${customSans}; }
                body { font-family: var(--sans-serif-font); }
            `;
            const result = replaceCSSVariables(css);
            expect(result).toContain(`font-family: ${customSans}`);
            expect(result).not.toContain(sansSerif); // 确保没有使用默认值
        });

        it("should replace variables inside complex values (e.g. border)", () => {
            const css = `
                :root { --border-color: black; }
                div { border: 1px solid var(--border-color); }
            `;
            const result = replaceCSSVariables(css);
            expect(result).toContain("div { border: 1px solid black; }");
        });

        it("should handle variables with functions (rgb/calc)", () => {
            const css = `
                :root { --c: 255, 0, 0; }
                div { color: rgb(var(--c)); }
            `;
            // 注意：你的正则 logic 主要是文本替换，
            // 只要 var(--c) 能匹配到，就能替换成 "255, 0, 0"
            const result = replaceCSSVariables(css);
            expect(result).toContain("div { color: rgb(255, 0, 0); }");
        });

        it("should prevent infinite loops in circular dependencies", () => {
            // A 引用 B，B 引用 A
            const css = `
                :root {
                    --var-a: var(--var-b);
                    --var-b: var(--var-a);
                }
                div { content: var(--var-a); }
            `;

            // 代码中有 `if (resolved.has(value)) return value;` 检查
            // 预期结果：不再死循环，而是停止解析，可能保留 var(...) 或部分解析
            // 关键是函数能正常返回，不崩
            const result = replaceCSSVariables(css);
            expect(result).toBeDefined();
            // 具体的返回值取决于递归停止点，通常它会保留最后一次尝试替换的值
        });

        it("should leave undefined variables as is", () => {
            const css = "div { color: var(--undefined-var); }";
            const result = replaceCSSVariables(css);
            // 这里的逻辑是 `if (cssVariables[varName])` 才替换，否则返回 match
            expect(result).toContain("color: var(--undefined-var);");
        });

        it("should clean up newlines and spaces in variable definitions", () => {
            const css = `
                :root {
                    --color:
                        blue;
                }
                p { color: var(--color); }
            `;
            const result = replaceCSSVariables(css);
            // 代码中有 .trim().replaceAll("\n", "")
            expect(result).toContain("p { color: blue; }");
        });
    });
});
