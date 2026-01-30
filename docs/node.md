# Wenyan Core API 文档：Node 环境渲染

> 本文档介绍 Wenyan 在 **纯 Node.js 环境** 下的 Markdown 渲染与样式应用能力。
>
> 适用于：
>
> * CLI 工具
> * Server-side 渲染
> * 自动化内容生产
> * Markdown → 微信草稿流水线

## 概览

在 Node 环境中，由于不存在浏览器 DOM，Wenyan 使用 **JSDOM** 模拟 DOM 来完成完整的渲染流程。你需要安装下列库：

```bash
npm install jsdom
```

核心能力由以下函数提供：

```ts
renderStyledContent()
getGzhContent() // 兼容旧版本
```

## StyledContent 数据结构

```ts
export interface StyledContent {
  content: string;       // 最终 HTML
  title?: string;        // Front Matter 中的 title
  cover?: string;        // Front Matter 中的 cover
  description?: string; // Front Matter 中的 description
}
```

## renderStyledContent（推荐）

```ts
async function renderStyledContent(
  content: string,
  options?: ApplyStylesOptions
): Promise<StyledContent>
```

### 功能说明

完整执行以下流程：

```text
Markdown
  ↓
Front Matter 解析
  ↓
Markdown → HTML
  ↓
JSDOM 创建 DOM
  ↓
应用主题 / 高亮 / 脚注 / macOS 风格
  ↓
输出 HTML 字符串
```

### 示例

```ts
import { renderStyledContent } from "@wenyan-md/core/node";

const result = await renderStyledContent(markdown, {
  themeId: "default",
  hlThemeId: "solarized-light",
});

console.log(result.content);
console.log(result.title);
```

### 参数说明

| 参数      | 类型                   | 说明             |
| ------- | -------------------- | -------------- |
| content | `string`             | 原始 Markdown    |
| options | `ApplyStylesOptions` | 样式选项（与浏览器版本一致） |

> [!NOTE]
> 
> Node 版本与浏览器版本使用 **完全一致的 ApplyStylesOptions**

## 四、getGzhContent（兼容旧版本）

```ts
async function getGzhContent(
  content: string,
  themeId: string,
  hlThemeId: string,
  isMacStyle?: boolean,
  isAddFootnote?: boolean
): Promise<StyledContent>
```

### 说明

* 这是旧版 API 的兼容封装
* 内部直接调用 `renderStyledContent`
* **不推荐新项目使用**

### 示例

```ts
const result = await getGzhContent(
  markdown,
  "default",
  "solarized-light"
);
```

## 五、设计说明（Node 渲染）

* Node 渲染 **不会依赖浏览器**
* 所有 DOM 操作均基于 JSDOM
* 输出结果是 **完整可用的 HTML**
* 可直接用于：

  * 文件写入
  * 微信 API
  * 静态站点生成
