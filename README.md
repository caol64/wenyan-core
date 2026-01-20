<div align="center">
    <img alt="logo" src="https://raw.githubusercontent.com/caol64/wenyan/main/Data/256-mac.png" />
</div>

# 文颜 CORE

[![npm](https://img.shields.io/npm/v/@wenyan-md/core)](https://www.npmjs.com/package/@wenyan-md/core)
[![License](https://img.shields.io/github/license/caol64/wenyan-core)](LICENSE)
![NPM Downloads](https://img.shields.io/npm/dm/%40wenyan-md%2Fcore)
[![Stars](https://img.shields.io/github/stars/caol64/wenyan-core?style=social)](https://github.com/caol64/wenyan-core)

## 简介

**文颜（Wenyan）** 是一套多平台 Markdown 排版与发布工具链，  
**文颜 CORE** 是其核心库，专注于：

- Markdown → HTML 渲染
- 主题排版（公众号 / Web）
- 代码高亮与样式增强
- 发布前内容处理（脚注、图片、样式兼容）

适合以下使用场景：

- 在 **Node.js / Web** 项目中嵌入排版能力
- 构建 **CLI / 桌面端 / MCP / AI 写作系统**
- 自定义 Markdown 排版或内容发布流程
- 作为文颜生态的二次开发基础

## 安装

```bash
npm install @wenyan-md/core
```

## 在 Node.js 环境中使用

（适用于 CLI / 服务端 / MCP / 自动发布场景）

### 1. 将 Markdown 排版后发布到公众号草稿箱


```ts
import { renderStyledContent } from "@wenyan-md/core/wrapper";
import { publishToDraft } from "@wenyan-md/core/publish";

const markdown = "# Hello, Wenyan";

const gzhContent = await renderStyledContent(markdown, {
  themeId: "lapis",
  hlThemeId: "solarized-light",
  isMacStyle: true,
  isAddFootnote: true,
});

const result = await publishToDraft(
  gzhContent.title,
  gzhContent.content,
  gzhContent.cover,
  {
    wechatAppId: "xxx",
    wechatAppSecret: "yyy",
  }
);

if (result.media_id) {
  console.log("上传成功：", result.media_id);
}
```

> [!NOTE]
>
> 在 Node 环境 下，文颜会自动识别 Markdown 中的本地图片，并上传至微信公众号素材库后再进行替换。

#### 参数说明

| 参数名           | 类型      | 说明                              |
| ---------------- | --------- | --------------------------------- |
| `inputContent`   | `string`  | 输入的 Markdown 文本，必填        |
| `themeId`          | `string`  | 排版主题 ID，必填                 |
| `hlThemeId` | `string`  | 代码高亮主题，必填                |
| `isMacStyle`     | `boolean` | 是否启用代码块 Mac 风格，默认开启 |
| `isAddFootnote`  | `boolean` | 是否将链接转脚注，默认开启        |

排版主题：

-   default / orangeheart / rainbow / lapis / pie / maize / purple / phycat

高亮主题：

-   atom-one-dark / atom-one-light / dracula / github-dark / github / monokai / solarized-dark / solarized-light / xcode

#### 环境变量注入 APPID 和 APP_SECRET

当环境变量存在时，`publishToDraft`可省略参数传入。

```sh
export WECHAT_APP_ID=xxx
export WECHAT_APP_SECRET=yyy
```

### 2. 使用自定义主题

```ts
import { renderStyledContent } from "@wenyan-md/core/wrapper";
import fs from "node:fs/promises";

const markdown = "# Hello, Wenyan";
const themeCss = await fs.readFile("/path/to/css", "utf-8");

const gzhContent = await renderStyledContent(markdown, {
  themeCss: themeCss,
  hlThemeId: "solarized-light",
  isMacStyle: true,
  isAddFootnote: true,
});
```

## 在浏览器环境使用

### 1. ES Module 方式

```ts
import { createWenyanCore } from "@wenyan-md/core";

const markdown = "# Hello from Browser";

const wenyan = await createWenyanCore();

// 解析 frontmatter
const { body } = await wenyan.handleFrontMatter(markdown);

// Markdown → HTML
const html = await wenyan.renderMarkdown(body);
document.getElementById("wenyan").innerHTML = html;

// 应用排版样式
const styledHtml = await wenyan.applyStylesWithTheme(
  document.getElementById("wenyan"),
  {
    themeId: "lapis",
    hlThemeId: "solarized-light",
    isMacStyle: true,
    isAddFootnote: true,
  }
);
```

### 2. IIFE（直接在浏览器中引入）

适用于 **纯前端 / 静态页面** 场景。

```html
<script src="https://cdn.jsdelivr.net/npm/css-tree/dist/csstree.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@wenyan-md/core/dist/browser/wenyan-core.js"></script>

<script>
    const html = await WenyanCore.renderMarkdown("# Hello from Browser");
    document.getElementById("wenyan").innerHTML = html;
</script>
```

## Markdown Frontmatter 说明

使用`publishToDraft`接口发布文章时，每篇文章顶部需包含 frontmatter：

```md
---
title: 示例文章
cover: /path/to/cover.jpg
---
```

-   `title`：必填
-   `cover`：本地路径或网络图片（正文有图可省略）

## 微信公众号 IP 白名单

> [!IMPORTANT]
>
> 请确保运行服务的服务器 IP 已加入微信公众号后台 IP 白名单。

配置说明：[https://yuzhi.tech/docs/wenyan/upload](https://yuzhi.tech/docs/wenyan/upload)

## 赞助

如果你觉得文颜对你有帮助，可以给我家猫咪买点罐头 ❤️

[https://yuzhi.tech/sponsor](https://yuzhi.tech/sponsor)

## License

Apache License Version 2.0
