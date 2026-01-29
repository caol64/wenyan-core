import { describe, it, expect } from "vitest";
import { createWenyanCore, HlTheme, registerHlTheme, registerTheme, Theme } from "../src/core";
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const html = `<body>
    <section id="wenyan">
        <h1><span>title</span></h1>
        <p>paragraph</p>
        <pre><code class="hljs language-python"><span class="hljs-keyword">import</span> sys
        </code></pre>
    </section>
</body>`;
const dom = new JSDOM(html);
const document = dom.window.document;
const wenyan = document.getElementById("wenyan");

const defaultTheme = readFileSync(resolve(__dirname, "../src/assets/themes/default.css"), "utf-8");
const theme: Theme = {
    meta: {
        id: "default",
        name: "Default",
        description: "The default theme.",
        appName: "Wenyan",
        author: "Author Name",
    },
    getCss: async () => {
        return defaultTheme;
    },
};

const defaultHlTheme = readFileSync(resolve(__dirname, "../src/assets/highlight/styles/github.min.css"), "utf-8");
const hlTheme: HlTheme = {
    id: "github",
    getCss: async () => {
        return defaultHlTheme;
    },
};

const instance = await createWenyanCore();
registerTheme(theme);
registerHlTheme(hlTheme);

describe("createWenyanCore", async () => {
    it("should", async () => {
        const result = await instance.applyStylesWithTheme(wenyan!, {
            themeId: "default",
            hlThemeId: "github",
            isMacStyle: true,
            isAddFootnote: true,
        });

        // 1. 验证根节点和基础属性
        expect(result).toContain('<section id="wenyan"');
        expect(result).toContain('data-provider="WenYan"');

        // 2. 验证文章主题 (default theme) 是否应用
        // 验证是否注入 (font-family)，default.css 里是没有的
        expect(result).toContain('font-family: system-ui');
        // 验证 h1 的样式 (default 主题通常是居中的)
        expect(result).toContain('text-align: center');
        expect(result).toContain('text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1)');

        // 3. 验证代码高亮 (github theme) 是否应用
        // 验证类名
        expect(result).toContain('class="hljs language-python"');
        // 验证关键字高亮颜色
        expect(result).toContain('class="hljs-keyword"');
        expect(result).toContain('color: rgb(215, 58, 73)');
        // 验证 github 浅色主题特有的颜色 (rgb(36, 41, 46) 是典型的 github 字体色)
        expect(result).toContain('color: rgb(36, 41, 46)');
        expect(result).toContain('background: rgb(255, 255, 255)');

        // 4. 验证 Mac 风格 (isMacStyle: true)
        // 验证圆角和阴影
        expect(result).toContain('border-radius: 5px');
        expect(result).toContain('box-shadow: rgba(0, 0, 0, 0.55) 0px 1px 5px');
        // 验证等宽字体是否注入
        expect(result).toContain('font-family: Menlo, Monaco, Consolas');

        // 5. 验证内容转换
        // 空格是否被替换为 &nbsp;
        expect(result).toContain('import</span>&nbsp;sys');
    });
});
