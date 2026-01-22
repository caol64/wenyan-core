# Wenyan Core API 文档

> Wenyan Core 是一个 **Markdown → HTML → 样式渲染** 的核心引擎，支持主题、代码高亮、数学公式（MathJax）、微信公众号渲染等能力。
>
> 本文档介绍 Wenyan Core 的核心 API 及其使用方式。

## 快速开始（Quick Start）

```ts
import { createWenyanCore } from "@wenyan-md/core";

const wenyan = await createWenyanCore({
  isConvertMathJax: true,
  isWechat: true,
});

// 1. Markdown → HTML
const html = await wenyan.renderMarkdown(markdown);

// 2. 插入到 DOM
container.innerHTML = html;

// 3. 应用主题 & 样式
const resultHtml = await wenyan.applyStylesWithTheme(container, {
  themeId: "default",
  hlThemeId: "solarized-light",
});
```

## createWenyanCore

```ts
async function createWenyanCore(
  options?: WenyanOptions
): Promise<WenyanCoreInstance>
```

### WenyanOptions

```ts
interface WenyanOptions {
  /** 是否将 MathJax 公式转换为 SVG / HTML */
  isConvertMathJax?: boolean;

  /** 是否启用微信公众号专用后处理 */
  isWechat?: boolean;
}
```

| 参数               | 默认值    | 说明              |
| ---------------- | ------ | --------------- |
| isConvertMathJax | `true` | 是否解析并渲染 MathJax |
| isWechat         | `true` | 是否执行微信文章兼容处理    |

> [!NOTE]
>
> `isWechat = true` 时，会启用：
>
> * DOM 结构清洗
> * 特定 class / style 修复
> * 微信兼容的 SVG / 列表处理

## 核心实例方法（WenyanCoreInstance）

### handleFrontMatter

```ts
handleFrontMatter(markdown: string): Promise<FrontMatterResult>
```

解析 Markdown 中的 Front Matter（YAML 头信息）。

#### 示例

```ts
const result = await wenyan.handleFrontMatter(markdown);

console.log(result.title);
console.log(result.body);
console.log(result.cover);
```

#### FrontMatterResult

```ts
interface FrontMatterResult {
  body: string;
  title?: string;
  description?: string;
  cover?: string;
}
```

### renderMarkdown

```ts
renderMarkdown(markdown: string): Promise<string>
```

将 Markdown 渲染为 HTML 字符串。

* 使用 `marked`
* 可选 MathJax 转换（由 `isConvertMathJax` 控制）
* **不包含样式**

#### 示例

```ts
const html = await wenyan.renderMarkdown(markdown);
```

### applyStylesWithTheme（推荐使用）

```ts
applyStylesWithTheme(
  wenyanElement: HTMLElement,
  options?: ApplyStylesOptions
): Promise<string>
```

对已渲染的 HTML 应用 **主题 + 代码高亮 + 结构增强**。处理后的 HTML 可直接复制粘贴到微信公众号编辑器。

#### ApplyStylesOptions

```ts
interface ApplyStylesOptions {
  /** 文章主题 ID */
  themeId?: string;

  /** 代码高亮主题 ID */
  hlThemeId?: string;

  /** 直接传入文章主题 CSS */
  themeCss?: string;

  /** 直接传入代码高亮 CSS */
  hlThemeCss?: string;

  /** 是否启用 macOS 风格样式 */
  isMacStyle?: boolean;

  /** 是否自动生成脚注 */
  isAddFootnote?: boolean;
}
```

| 参数            | 默认值                 | 说明         |
| ------------- | ------------------- | ---------- |
| themeId       | `"default"`         | 文章主题       |
| hlThemeId     | `"solarized-light"` | 代码高亮主题     |
| themeCss      | `undefined`         | 直接覆盖主题 CSS |
| hlThemeCss    | `undefined`         | 直接覆盖高亮 CSS |
| isMacStyle    | `true`              | macOS 风格排版 |
| isAddFootnote | `true`              | 自动脚注       |

> [!NOTE]
> 
> `themeCss / hlThemeCss` 优先级 **高于** `themeId / hlThemeId`

### applyStylesWithResolvedCss（低阶 API）

```ts
applyStylesWithResolvedCss(
  wenyanElement: HTMLElement,
  options: {
    themeCss: string;
    hlThemeCss: string;
    isMacStyle: boolean;
    isAddFootnote: boolean;
  }
): Promise<string>
```

适合以下场景：

* CSS 已经由外部系统加载 / 缓存
* 自定义主题市场
* Server-side / Worker 环境预处理

## 主题与代码高亮 API

### 文章主题（GZH Themes）

```ts
import {
  registerAllBuiltInThemes,
  getTheme,
  getAllGzhThemes
} from "@wenyan-md/core";
```

* `registerAllBuiltInThemes()`：注册内置主题
* `getTheme(id)`：精确获取主题
* `getAllGzhThemes()`：获取所有主题列表

### 代码高亮主题（Highlight Themes）

```ts
import {
  registerBuiltInHlThemes,
  getHlTheme,
  getAllHlThemes
} from "@wenyan-md/core";
```

## 工具函数与高级能力

### CSS 相关

```ts
import { createCssModifier } from "@wenyan-md/core";
```

用于：

* 动态修改 CSS 变量
* 主题派生、微调
* 深度定制排版

### 字体工具

```ts
import { serif, sansSerif, monospace } from "@wenyan-md/core";
```

### macOS 样式

```ts
import { macStyleCss } from "@wenyan-md/core";
```

可用于：

* 单独注入 macOS 样式
* 非 Wenyan 环境复用样式

## 典型渲染流程（推荐）

```text
Markdown
  ↓
handleFrontMatter
  ↓
renderMarkdown
  ↓
插入 DOM
  ↓
applyStylesWithTheme
  ↓
最终 HTML
```

## 设计说明

* Wenyan Core **不直接操作字符串样式**
* 所有样式操作基于 **真实 DOM**
* 主题 / 高亮 CSS 统一经过：

  * CSS Variable 替换
  * Pseudo Element 应用
* 微信渲染是 **可选后处理阶段**

## 适用场景

* Web App（Svelte / React / Vue）
* Tauri / Electron
* macOS SwiftUI（WebView）
* Server-side 预渲染
* Markdown → 微信公众号文章
