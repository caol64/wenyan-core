<div align="center">
    <img alt="logo" src="https://raw.githubusercontent.com/caol64/wenyan/main/Data/256-mac.png" />
</div>

# 文颜 CORE

[![npm](https://img.shields.io/npm/v/@wenyan-md/core)](https://www.npmjs.com/package/@wenyan-md/core)
[![License](https://img.shields.io/github/license/caol64/wenyan-core)](LICENSE)
![NPM Downloads](https://img.shields.io/npm/dm/%40wenyan-md%2Fcore)
[![Stars](https://img.shields.io/github/stars/caol64/wenyan-core?style=social)](https://github.com/caol64/wenyan-core)

## 简介

**文颜（Wenyan）** 是一款多平台 Markdown 排版与发布工具，支持将 Markdown 一键转换并发布至：

- 微信公众号
- 知乎
- 今日头条
- 以及其它内容平台（持续扩展中）

文颜的目标是：**让写作者与开发者专注内容，而不是排版和平台适配**。

本仓库是 **文颜的核心库（CORE）**，适合以下场景：

- 嵌入 Node.js / Web 项目
- 构建自定义写作或发布系统
- 与 CLI / 桌面端 / MCP / AI 系统集成
- 二次开发排版或发布能力

## 文颜的不同版本

文颜目前提供多种形态，覆盖不同使用场景：

* [macOS App Store 版](https://github.com/caol64/wenyan) - MAC 桌面应用
* [跨平台桌面版](https://github.com/caol64/wenyan-pc) - Windows / Linux
* [CLI 版本](https://github.com/caol64/wenyan-cli) - 命令行 / CI 自动化发布
* [MCP 版本](https://github.com/caol64/wenyan-mcp) - AI 自动发文
* 👉 **CORE 版本**（本项目）- 文颜核心能力库

## 功能特性

* 使用内置主题对 Markdown 内容排版
* 自动处理并上传图片（本地 / 网络）
* 支持数学公式（MathJax）
* 一键发布文章到微信公众号草稿箱
* 可在 Node / 浏览器 环境中运行

## 主题效果预览

👉 [内置主题预览](https://yuzhi.tech/docs/wenyan/theme)

文颜内置并适配了多个优秀的 Typora 主题，在此感谢原作者：

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

## 基本用法

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
  isMacStyle,
  isAddFootnote,
);
```

#### 参数说明

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| `inputContent` | `string` | 输入的 Markdown 文本，必填 |
| `theme` | `string` | 排版主题 ID，必填 |
| `highlightTheme` | `string` | 代码高亮主题，必填 |
| `isMacStyle` | `boolean` | 是否启用代码块 Mac 风格，默认开启 |
| `isAddFootnote` | `boolean` | 是否将链接转脚注，默认开启 |

排版主题：

- default / orangeheart / rainbow / lapis / pie / maize / purple / phycat

高亮主题：

- atom-one-dark / atom-one-light / dracula / github-dark / github / monokai / solarized-dark / solarized-light / xcode

#### 返回值

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `title` | `string` | 从 frontmatter 中获取的文章标题 |
| `cover` | `string` | 封面图 |
| `content` | `string` | 转换后的 HTML 内容 |
| `description` | `string` | frontmatter 中的文章简介 |

---

### 2. 发布到微信公众号草稿箱

```ts
import { publishToDraft } from "@wenyan-md/core/publish";

const data = await publishToDraft(title, content, cover, wechatAppId, wechatAppSecret);

if (data.media_id) {
  console.log("上传成功：", data.media_id);
}
```

#### 参数说明

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| `title` | `string` | 文章标题 |
| `content` | `string` | HTML 内容 |
| `cover` | `string` | 封面图 URL |
| `wechatAppId` | `string` | 微信公众号 APPID |
| `wechatAppSecret` | `string` | 微信公众号 APP_SECRET |

#### 环境变量注入APPID和APP_SECRET

也可以通过环境变量注入APPID和APP_SECRET：

```sh
export WECHAT_APP_ID=xxx
export WECHAT_APP_SECRET=yyy
```

```ts
import { publishToDraft } from "@wenyan-md/core/publish";

const data = await publishToDraft(title, content, cover);

if (data.media_id) {
  console.log("上传成功：", data.media_id);
}
```

## 浏览器直接使用

文颜 CORE 提供浏览器可直接引入的 IIFE 构建版本，适合前端或纯静态页面使用。目前不支持“发布到微信公众号草稿箱”功能。

```html
<script src="https://cdn.jsdelivr.net/npm/css-tree/dist/csstree.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@wenyan-md/core/dist/browser/wenyan-core.js"></script>

<script>
  const { configureMarked, renderMarkdown, themes } = WenyanCore;
  configureMarked();
  const html = await renderMarkdown('# Hello from Browser');
  document.body.innerHTML = html;
</script>
```

## Markdown Frontmatter 说明

每篇文章顶部需包含 frontmatter：

```md
---
title: 示例文章
cover: /path/to/cover.jpg
description: 文章简介
---
```

* `title`：必填
* `cover`：本地路径或网络图片（正文有图可省略）

## 微信公众号 IP 白名单

> ⚠️ 重要
>
> 请确保运行服务的服务器 IP 已加入微信公众号后台 IP 白名单。

配置说明：[https://yuzhi.tech/docs/wenyan/upload](https://yuzhi.tech/docs/wenyan/upload)

## 赞助

如果你觉得文颜对你有帮助，可以给我家猫咪买点罐头 ❤️

[https://yuzhi.tech/sponsor](https://yuzhi.tech/sponsor)

## License

Apache License Version 2.0
