
# Wenyan Core API 文档：微信公众号发布

> 本文档介绍 Wenyan 在 **纯 Node.js 环境** 下，将内容发布到 **微信公众号草稿箱** 的能力。

## 能力概览

此模块提供一整套 **自动化发布流水线**：

* 获取 Access Token
* 自动上传图片（本地 / 远程）
* 自动替换 `<img src>`
* 自动选择封面
* 发布到公众号草稿箱

## publishToDraft

```ts
async function publishToDraft(
  title: string,
  content: string,
  cover?: string,
  options?: PublishOptions
): Promise<any>
```

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
await publishToDraft(
  "我的第一篇文章",
  htmlContent,
  "", // 不指定封面，自动使用正文第一张图片
  {
    relativePath: process.cwd(),
  }
);
```

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

### 封面选择规则

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

## 典型完整流程

```ts
import {
  renderStyledContent,
  publishToDraft
} from "@wenyan-md/core/node";

const { content, title } = await renderStyledContent(markdown);

await publishToDraft(
  title ?? "未命名文章",
  content
);
```

## 适用场景

* 自动化内容发布
* Markdown → 微信草稿 CLI
* CI / 定时任务
* 内容生产后台

## 架构设计说明

* **渲染与发布完全解耦**
* 可只使用渲染，不使用微信发布
* 微信 API 被封装在 Node Adapter 中
* 未来可扩展：

  * 多公众号
  * 草稿 / 群发
  * 视频 / 图文混合

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
