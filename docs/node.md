# Wenyan Core API 文档：Node 环境渲染

> 本文档介绍 Wenyan 在 **纯 Node.js 环境** 下的 Markdown 渲染与样式应用能力。
>
> 适用于：
>
> * CLI 工具
> * Server-side 渲染
> * 自动化内容生产
> * Markdown → 微信草稿流水线
> * 图片消息（小绿书）发布

## 概览

在 Node 环境中，由于不存在浏览器 DOM，Wenyan 使用 **JSDOM** 模拟 DOM 来完成完整的渲染流程。你需要安装下列库：

```bash
npm install jsdom
```

核心能力由以下函数提供：

```ts
renderStyledContent()
prepareRenderContext()
```

## StyledContent 数据结构

```ts
export interface StyledContent {
  content: string;       // 最终 HTML
  title?: string;        // Front Matter 中的 title
  cover?: string;        // Front Matter 中的 cover
  description?: string;  // Front Matter 中的 description
  image_list?: string[]; // 图片路径列表（小绿书）
  type?: string;         // 文章类型
}
```

## renderStyledContent（推荐）

```ts
async function renderStyledContent(
  content: string,
  options?: ApplyStylesOptions,
  coreInstance?: WenyanCoreInstance
): Promise<string>
```

### 功能说明

渲染 Markdown 并应用主题样式，输出 HTML 字符串。

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

const html = await renderStyledContent(markdown, {
  themeId: "default",
  hlThemeId: "solarized-light",
});
```

### 参数说明

| 参数      | 类型                   | 说明             |
| ------- | -------------------- | -------------- |
| content | `string`             | 原始 Markdown    |
| options | `ApplyStylesOptions` | 样式选项（与浏览器版本一致） |
| coreInstance | `WenyanCoreInstance` | 可选，自定义核心实例 |

> [!NOTE]
> 
> Node 版本与浏览器版本使用 **完全一致的 ApplyStylesOptions**

## prepareRenderContext

```ts
async function prepareRenderContext(
  inputContent: string | undefined,
  options: RenderOptions,
  getInputContent: GetInputContentFn
): Promise<RenderContext>
```

完整的渲染上下文准备函数，包括内容读取、frontmatter 解析、图片消息处理和主题渲染。CLI 和 Server 模式内部均使用此函数。

### 功能说明

```text
读取 Markdown 内容
  ↓
handleFrontMatter 解析
  ↓
type: image 自动提取图片（如有）
  ↓
判断是否为图片消息
  ↓  是                     ↓  否
跳过主题渲染              应用主题样式
  ↓                        ↓
返回 RenderContext
```

### RenderContext

```ts
export interface RenderContext {
  gzhContent: StyledContent;
  absoluteDirPath: string | undefined;
}
```

### 图片消息（小绿书）处理

当 frontmatter 中包含 `image_list` 或 `type: image` 时，`prepareRenderContext` 会自动识别为图片消息模式：

1. **`type: image` 自动提取**：如果设置 `type: image` 且未手动指定 `image_list`，函数会：
   - 渲染 Markdown 为 HTML
   - 提取所有 `<img>` 的 `src` 路径
   - 将路径列表注入 `image_list`
   - 从正文中移除所有图片节点（空的父 `<p>` 也会一并移除）

2. **跳过主题渲染**：当存在 `image_list` 时，不应用主题样式，直接返回原始内容

### 示例

```ts
import { prepareRenderContext } from "@wenyan-md/core/node";

const { gzhContent, absoluteDirPath } = await prepareRenderContext(
  undefined,
  { theme: "default", highlight: "solarized-light", macStyle: true, footnote: true },
  myGetInputContentFn,
);

if (gzhContent.image_list && gzhContent.image_list.length > 0) {
  // 图片消息路径
  await publishImageTextToWechatDraft({
    ...gzhContent,
    title: gzhContent.title!,
    images: gzhContent.image_list,
  });
} else {
  // 图文文章路径
  await publishToWechatDraft({
    ...gzhContent,
    title: gzhContent.title!,
  });
}
```

## 设计说明（Node 渲染）

* Node 渲染 **不会依赖浏览器**
* 所有 DOM 操作均基于 JSDOM
* 输出结果是 **完整可用的 HTML**
* 图片消息模式自动跳过主题渲染，保持图片为主体
* 可直接用于：

  * 文件写入
  * 微信 API
  * 静态站点生成
  * 图片消息（小绿书）发布
