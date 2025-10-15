<div align="center">
    <img alt="logo" src="https://raw.githubusercontent.com/caol64/wenyan/main/Data/256-mac.png" />
</div>

# 文颜 CORE

[![npm](https://img.shields.io/npm/v/@wenyan-md/core)](https://www.npmjs.com/package/@wenyan-md/core)
[![License](https://img.shields.io/github/license/caol64/wenyan-core)](LICENSE)
![NPM Downloads](https://img.shields.io/npm/dm/%40wenyan-md%2Fcore)
[![Stars](https://img.shields.io/github/stars/caol64/wenyan-core?style=social)](https://github.com/caol64/wenyan-core)

「文颜」是一款多平台排版美化工具，让你将 Markdown 一键发布至微信公众号、知乎、今日头条等主流写作平台。

**文颜**现已推出多个版本：

* [macOS App Store 版](https://github.com/caol64/wenyan) - MAC 桌面应用
* [跨平台版本](https://github.com/caol64/wenyan-pc) - Windows/Linux 跨平台桌面应用
* [CLI 版本](https://github.com/caol64/wenyan-cli) - CI/CD 或脚本自动化发布公众号文章
* [MCP 版本](https://github.com/caol64/wenyan-mcp) - 让 AI 自动发布公众号文章
* [嵌入版本](https://github.com/caol64/wenyan-core) - 将文颜的核心功能嵌入 Node 或者 Web 项目

本项目是 **文颜的核心库文件**，你可以将其方便地嵌入自己的应用中，以实现排版美化和自动发布功能。

## 功能

* 使用内置主题对 Markdown 内容排版
* 支持图片自动上传
* 支持数学公式渲染
* 一键发布文章到微信公众号草稿箱

## 主题效果

👉 [内置主题预览](https://yuzhi.tech/docs/wenyan/theme)

文颜采用了多个开源的 Typora 主题，在此向各位作者表示感谢：

- [Orange Heart](https://github.com/evgo2017/typora-theme-orange-heart)
- [Rainbow](https://github.com/thezbm/typora-theme-rainbow)
- [Lapis](https://github.com/YiNNx/typora-theme-lapis)
- [Pie](https://github.com/kevinzhao2233/typora-theme-pie)
- [Maize](https://github.com/BEATREE/typora-maize-theme)
- [Purple](https://github.com/hliu202/typora-purple-theme)
- [物理猫-薄荷](https://github.com/sumruler/typora-theme-phycat)

## 安装方式

```bash
pnpm add @wenyan-md/core
# 或者
npm install @wenyan-md/core
# 或者
yarn add @wenyan-md/core
```

## 使用示例

### 1. Markdown 排版美化

```ts
import { getGzhContent } from "@wenyan-md/core/wrapper";

const inputContent = "# Hello, Wenyan";
const theme = "lapis";
const highlightTheme = "solarized-light";
const isMacStyle = true;

const { title, cover, content, description } = await getGzhContent(
  inputContent,
  theme,
  highlightTheme,
  isMacStyle
);
```

#### 参数说明

| 参数名              | 类型        | 说明                                              |
| ---------------- | --------- | ----------------------------------------------- |
| `inputContent`   | `string`  | 输入的 Markdown 文本                                 |
| `theme`          | `string`  | 排版主题 ID（如 `"lapis"`, `"default"` 等，见下文）       |
| `highlightTheme` | `string`  | 代码高亮主题（如 `"github"`, `"solarized-light"`， 见下文） |
| `isMacStyle`     | `boolean` | 代码块是否启用 Mac 风格                   |

排版主题可选参数：

- default
- orangeheart
- rainbow
- lapis
- pie
- maize
- purple
- phycat

高亮主题可选参数：

- atom-one-dark
- atom-one-light
- dracula
- github-dark
- github
- monokai
- solarized-dark
- solarized-light
- xcode

#### 返回值

| 字段            | 类型       | 说明                     |
| ------------- | -------- | ---------------------- |
| `title`       | `string` | `frontmatter`中的文章标题，见下文 |
| `cover`       | `string` | `frontmatter`中的文章封面图，见下文          |
| `content`     | `string` | 转换后的 HTML 文章内容，发布接口需要用到         |
| `description` | `string` | `frontmatter`中的文章简介，见下文         |

---

### 2. 发布到微信公众号草稿箱

```ts
import { publishToDraft } from "@wenyan-md/core/publish";

// 首先确保环境变量有效
const wechatAppId = process.env.WECHAT_APP_ID;
const wechatAppSecret = process.env.WECHAT_APP_SECRET;

if (!wechatAppId || !wechatAppSecret) {
  console.error("WECHAT_APP_ID and WECHAT_APP_SECRET must be set as environment variables.");
  process.exit(1);
}

const data = await publishToDraft(title, content, cover);

if (data.media_id) {
  console.log(`上传成功，media_id: ${data.media_id}`);
} else {
  console.error(`上传失败，\n${data}`);
}
```

#### 参数说明

| 参数名       | 类型       | 说明         |
| --------- | -------- | ---------- |
| `title`   | `string` | 文章标题       |
| `content` | `string` | 文章 HTML 内容 |
| `cover`   | `string` | 封面图 URL    |

#### 返回值

返回 **微信公众号 API 的响应对象**，常见字段：

| 字段         | 类型       | 说明                    |
| ---------- | -------- | --------------------- |
| `media_id` | `string` | 草稿的 media\_id，后续发布时需要 |

## 环境变量

在使用 `publishToDraft` 前，需要在环境中配置：

* `WECHAT_APP_ID`
* `WECHAT_APP_SECRET`

推荐通过 `.env` 文件或 CI/CD 环境变量注入。

## 浏览器直接使用

除了通过 `npm` 安装外，你也可以直接在浏览器环境中引入打包好的版本（IIFE 格式），无需构建工具。

推荐使用 **[unpkg](https://unpkg.com/)** 或 **[jsDelivr](https://www.jsdelivr.com/)**。

```html
<!-- 从 unpkg 引入 -->
<script src="https://unpkg.com/@wenyan-md/core/dist/browser/wenyan-math.js"></script>
<script src="https://unpkg.com/@wenyan-md/core/dist/browser/wenyan-style.js"></script>
<script src="https://unpkg.com/@wenyan-md/core/dist/browser/wenyan-core.js"></script>

<!-- 或者从 jsDelivr 引入 -->
<script src="https://cdn.jsdelivr.net/npm/@wenyan-md/core/dist/browser/wenyan-math.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@wenyan-md/core/dist/browser/wenyan-style.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@wenyan-md/core/dist/browser/wenyan-core.js"></script>

<script>
  // 使用全局变量 WenyanCore
  const { configureMarked, renderMarkdown, themes } = WenyanCore;

  (async () => {
    configureMarked();
    const input = "# Hello from Browser";
    const content = await renderMarkdown(input);
    const theme = themes["lapis"];
    const styledCss = await theme.getCss();
    const style = document.createElement("style");
    style.textContent = styledCss;
    document.head.appendChild(style);
    document.body.innerHTML = content;
  })();
</script>
```

这样你就可以在 **任意前端项目** 或 **纯静态页面** 中直接使用文颜的功能。

## 微信公众号 IP 白名单

请务必将服务器 IP 加入公众号平台的 IP 白名单，以确保上传接口调用成功。
详细配置说明请参考：[https://yuzhi.tech/docs/wenyan/upload](https://yuzhi.tech/docs/wenyan/upload)

## 配置说明（Frontmatter）

为了可以正确上传文章，需要在每一篇 Markdown 文章的开头添加一段`frontmatter`，提供`title`、`cover`两个字段：

```md
---
title: 在本地跑一个大语言模型(2) - 给模型提供外部知识库
cover: /Users/lei/Downloads/result_image.jpg
description: 本文介绍如何为本地大语言模型提供外部知识库。
---
```

* `title` 是文章标题，必填。
* `cover` 是文章封面，支持本地路径和网络图片：

  * 如果正文有至少一张图片，可省略，此时将使用其中一张作为封面；
  * 如果正文无图片，则必须提供 cover。

## 关于图片自动上传

* 支持图片路径：

  * 本地路径（如：`/Users/lei/Downloads/result_image.jpg`）
  * 网络路径（如：`https://example.com/image.jpg`）

## 赞助

如果您觉得不错，可以给我家猫咪买点罐头吃。[喂猫❤️](https://yuzhi.tech/sponsor)

## License

Apache License Version 2.0
