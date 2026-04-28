
# Wenyan Core API 文档：微信公众号发布

> 本文档介绍 Wenyan 在 **纯 Node.js 环境** 下，将内容发布到 **微信公众号草稿箱** 的能力。

## 能力概览

此模块提供一整套 **自动化发布流水线**：

* 获取 Access Token
* 自动上传图片（本地 / 远程）
* 自动替换 `<img src>`
* 自动选择封面
* 发布到公众号草稿箱
* 支持图文文章与图片消息（小绿书）

首先，请安装下列库：

```bash
npm install jsdom form-data-encoder formdata-node
```

## publishToWechatDraft

发布 **图文文章** 到微信公众号草稿箱。

```ts
async function publishToWechatDraft(
  articleOptions: ArticleOptions, publishOptions?: PublishOptions
): Promise<WechatPublishResponse>
```

### ArticleOptions

```ts
export interface ArticleOptions {
  title: string;
  content: string;
  cover?: string;
  author?: string;
  source_url?: string;
  need_open_comment?: boolean;
  only_fans_can_comment?: boolean;
}
```

| 参数           | 说明              |
| ------------ | --------------- |
| title        | 文章标题     |
| content      | 文章内容（HTML） |
| cover        | 文章封面       |
| author       | 作者       |
| source_url   | 原文地址       |
| need_open_comment   | 是否打开评论       |
| only_fans_can_comment   | 是否粉丝才可评论       |

### PublishOptions

```ts
export interface PublishOptions {
  appId?: string;
  appSecret?: string;
  relativePath?: string;
}
```

| 参数           | 说明              |
| ------------ | --------------- |
| appId        | 微信公众号 AppID     |
| appSecret    | 微信公众号 AppSecret |
| relativePath | 本地图片的相对路径       |

> [!NOTE]
> 
> 如果未传入 `appId / appSecret`，将自动从环境变量读取：
>
> ```bash
> WECHAT_APP_ID
> WECHAT_APP_SECRET
> ```

### 示例

```ts
await publishToWechatDraft({
  title: "我的第一篇文章",
  content: htmlContent,
  cover: "", // 不指定封面，自动使用正文第一张图片
}, {
  relativePath: process.cwd(),
});
```

## publishImageTextToWechatDraft

发布 **图片消息（小绿书）** 到微信公众号草稿箱。

```ts
async function publishImageTextToWechatDraft(
  articleOptions: ImageTextArticleOptions, publishOptions?: PublishOptions
): Promise<WechatPublishResponse>
```

图片消息以图片为主体，适合发布图集类内容。发布后在公众号中显示为「小绿书」样式。

### ImageTextArticleOptions

```ts
export interface ImageTextArticleOptions extends ArticleOptions {
  images: string[];
}
```

`ImageTextArticleOptions` 继承 `ArticleOptions` 的所有字段，并新增以下字段：

| 参数    | 说明                                           |
| ----- | -------------------------------------------- |
| images | 图片路径列表（本地路径或网络 URL），至少 1 张，最多 20 张。第一张默认为封面 |

### 示例

```ts
await publishImageTextToWechatDraft({
  title: "人勤春来早，读书正当时",
  content: "<p>正文内容</p>",
  images: [
    "./photos/1.jpeg",
    "./photos/2.jpeg",
    "./photos/3.jpeg",
  ],
}, {
  relativePath: process.cwd(),
});
```

### 封面选择规则

1. 如果显式传入 `cover` → 使用该图片作为封面
2. 否则使用 `images` 列表中的第一张图片

## 图片处理逻辑说明

### 支持的图片来源

* ✅ HTTP / HTTPS URL
* ✅ 本地文件路径

### 自动处理流程

```text
HTML
  ↓
解析 <img>
  ↓
下载 / 读取图片
  ↓
上传至微信素材库
  ↓
替换 src
```

### 封面选择规则（图文文章）

1. 如果显式传入 `cover` → 使用该图片
2. 否则使用正文中第一张图片
3. 如果都不存在 → 抛出错误

## 错误处理说明

所有 API 在以下情况下会抛出 Error：

* Access Token 获取失败
* 图片下载失败
* 图片大小为 0
* 微信接口返回 errcode
* 无法确定封面图
* 图片消息未提供图片（`images` 为空）

## 典型完整流程

### 图文文章

```ts
import {
  renderStyledContent,
  publishToWechatDraft
} from "@wenyan-md/core/node";

const { content, title } = await renderStyledContent(markdown);

await publishToWechatDraft({
  title: title ?? "未命名文章",
  content,
});
```

### 图片消息（小绿书）

```ts
import {
  renderStyledContent,
  publishImageTextToWechatDraft
} from "@wenyan-md/core/node";

const { content, title, image_list } = await renderStyledContent(markdown);

await publishImageTextToWechatDraft({
  title: title ?? "未命名文章",
  content,
  images: image_list!,
});
```

## 适用场景

* 自动化内容发布
* Markdown → 微信草稿 CLI
* CI / 定时任务
* 内容生产后台
* 图集类内容发布（小绿书）

## 架构设计说明

* **渲染与发布完全解耦**
* 可只使用渲染，不使用微信发布
* 微信 API 被封装在 Node Adapter 中
* 未来可扩展：

  * 多公众号
  * 草稿 / 群发
  * 视频 / 图文混合

## Markdown Frontmatter 说明

### 图文文章

使用 `publishToWechatDraft` 接口发布文章时，每篇文章顶部需包含 frontmatter：

```md
---
title: 示例文章
cover: /path/to/cover.jpg
---
```

-   `title`：必填
-   `cover`：本地路径或网络图片（正文有图可省略）

### 图片消息（小绿书）

使用 `publishImageTextToWechatDraft` 接口时，可通过以下两种方式指定图片：

**方式一：手动指定 image_list**

```md
---
title: 人勤春来早，读书正当时
image_list:
  - ./1.jpeg
  - ./2.jpeg
  - ./3.jpeg
---
```

**方式二：使用 type: image 自动提取（推荐）**

```md
---
title: 人勤春来早，读书正当时
type: image
---

![](./1.jpeg)
![](./2.jpeg)
![](./3.jpeg)
```

设置 `type: image` 后，Core 会自动从正文中提取所有图片路径注入 `image_list`，并从正文中移除图片引用。

## 微信公众号 IP 白名单

> [!IMPORTANT]
>
> 请确保运行服务的服务器 IP 已加入微信公众号后台 IP 白名单。

配置说明：[https://yuzhi.tech/docs/wenyan/upload](https://yuzhi.tech/docs/wenyan/upload)
