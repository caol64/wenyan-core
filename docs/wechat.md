
# Wenyan Core API 文档：微信公众号发布

> 本文档介绍 Wenyan 在 **纯 Node.js 环境** 下，将内容发布到 **微信公众号草稿箱与发布链路** 的能力。

## 能力概览

此模块提供一整套 **自动化发布流水线**：

* 获取 Access Token
* 自动上传图片（本地 / 远程）
* 自动替换 `<img src>`
* 自动选择封面
* 发布到公众号草稿箱
* 提交草稿到发布队列并查询发布状态

## 使用的 API 接口

### 微信公众号官方接口

| 接口 | 方法 | URL |
| --- | --- | --- |
| 获取 Access Token | GET | `https://api.weixin.qq.com/cgi-bin/token` |
| 上传永久素材（图片） | POST | `https://api.weixin.qq.com/cgi-bin/material/add_material` |
| 获取永久素材 | POST | `https://api.weixin.qq.com/cgi-bin/material/get_material` |
| 获取永久素材总数 | GET | `https://api.weixin.qq.com/cgi-bin/material/get_materialcount` |
| 获取永久素材列表 | POST | `https://api.weixin.qq.com/cgi-bin/material/batchget_material` |
| 上传图文消息图片 | POST | `https://api.weixin.qq.com/cgi-bin/media/uploadimg` |
| 删除永久素材 | POST | `https://api.weixin.qq.com/cgi-bin/material/del_material` |
| 新增临时素材 | POST | `https://api.weixin.qq.com/cgi-bin/media/upload` |
| 获取临时素材 | GET | `https://api.weixin.qq.com/cgi-bin/media/get` |
| 获取高清语音素材 | GET | `https://api.weixin.qq.com/cgi-bin/media/get/jssdk` |
| 新增草稿（图文） | POST | `https://api.weixin.qq.com/cgi-bin/draft/add` |
| 草稿箱开关设置 | POST | `https://api.weixin.qq.com/cgi-bin/draft/switch` |
| 获取草稿列表 | POST | `https://api.weixin.qq.com/cgi-bin/draft/batchget` |
| 获取草稿总数 | GET | `https://api.weixin.qq.com/cgi-bin/draft/count` |
| 获取草稿详情 | POST | `https://api.weixin.qq.com/cgi-bin/draft/get` |
| 更新草稿（图文） | POST | `https://api.weixin.qq.com/cgi-bin/draft/update` |
| 删除草稿 | POST | `https://api.weixin.qq.com/cgi-bin/draft/delete` |
| 提交草稿发布 | POST | `https://api.weixin.qq.com/cgi-bin/freepublish/submit` |
| 查询发布状态 | POST | `https://api.weixin.qq.com/cgi-bin/freepublish/get` |
| 获取已发布文章详情 | POST | `https://api.weixin.qq.com/cgi-bin/freepublish/getarticle` |

### 客户端发布服务接口（wenyan-cli server）

| 接口 | 方法 | 路径 |
| --- | --- | --- |
| 健康检查 | GET | `/health` |
| 鉴权校验 | GET | `/verify` |
| 上传内容/图片 | POST | `/upload` |
| 触发远端发布 | POST | `/publish` |

首先，请安装下列库：

```bash
npm install jsdom form-data-encoder formdata-node
```

## publishToWechatDraft

```ts
async function publishToWechatDraft(
  articleOptions: ArticleOptions, publishOptions?: PublishOptions
): Promise<any>
```

### ArticleOptions

```ts
export interface ArticleOptions {
  title: string;
  content: string;
  cover?: string;
  author?: string;
  source_url?: string;
}
```

| 参数           | 说明              |
| ------------ | --------------- |
| title        | 文章标题     |
| content      | 文章内容 |
| cover        | 文章封面       |
| author       | 作者       |
| source_url   | 原文地址       |

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

## 发布链路相关 API

- `submitWechatDraft(mediaId, options?)`：提交草稿发布，返回 `publish_id`
- `getWechatPublishStatus(publishId, options?)`：查询发布任务状态
- `getWechatPublishedArticle(articleId, options?)`：获取已发布文章详情
- `getWechatMaterial(mediaId, options?)`：获取永久素材详情（可能返回 JSON 或二进制）
- `getWechatMaterialCount(options?)`：获取永久素材总数
- `getWechatMaterialList(options, publishOptions?)`：分页获取永久素材列表
- `uploadWechatArticleImage(imagePathOrUrl, options?)`：上传图文消息图片并返回 URL
- `deleteWechatMaterial(mediaId, options?)`：删除永久素材
- `uploadWechatTemporaryMaterial(type, filePathOrUrl, options?)`：上传临时素材
- `getWechatTemporaryMaterial(mediaId, options?)`：获取临时素材（可能返回 JSON 或二进制）
- `getWechatHdVoice(mediaId, options?)`：获取高清语音素材（可能返回 JSON 或二进制）
- `switchWechatDraft(checkOnly?, options?)`：设置或查询草稿箱开关
- `getWechatDraftList(options, publishOptions?)`：获取草稿列表
- `getWechatDraftCount(options?)`：获取草稿总数
- `getWechatDraftDetail(mediaId, options?)`：获取草稿详情
- `updateWechatDraft(options, publishOptions?)`：更新指定草稿内容
- `deleteWechatDraft(mediaId, publishOptions?)`：删除指定草稿

## 参数与约束（与当前实现保持一致）

### 类型约束

```ts
type WechatMaterialType = "image" | "voice" | "video" | "thumb";
type WechatPermanentMaterialType = "image" | "voice" | "video" | "news";

interface WechatBatchGetMaterialOptions {
  type: WechatPermanentMaterialType;
  offset: number; // >= 0
  count: number;  // 1..20
}

interface WechatDraftListOptions {
  offset: number; // >= 0
  count: number;  // 1..20
  no_content?: 0 | 1;
}
```

### 调用参数校验规则

- `getWechatMaterial(mediaId)` / `deleteWechatMaterial(mediaId)` / `getWechatTemporaryMaterial(mediaId)` / `getWechatHdVoice(mediaId)`  
  `mediaId` 必须是非空字符串。
- `submitWechatDraft(mediaId)`：`mediaId` 必须是非空字符串。
- `getWechatPublishStatus(publishId)`：`publishId` 必须是非空字符串。
- `getWechatPublishedArticle(articleId)`：`articleId` 必须是非空字符串。
- `getWechatMaterialList(options)`：`options.offset >= 0` 且 `options.count` 只能是 `1..20`。
- `getWechatDraftList(options)`：`offset/count` 同上，`no_content` 仅允许 `0 | 1`。
- `switchWechatDraft(checkOnly)`：
  - `true`：仅查询状态（请求将携带微信查询参数 `checkonly=1`）
  - `false`：执行开关设置请求（用于设置草稿能力开关，具体开关结果可从返回值中的 `is_open` 判断）
- `updateWechatDraft(options)`：
  - `options.media_id` 非空
  - `options.index >= 0`
  - `articles.pic_crop_235_1 / articles.pic_crop_1_1`（若传）必须是 `X1_Y1_X2_Y2`（下划线分隔四个坐标数值 `X1, Y1, X2, Y2`，例如 `0_0_100_100`）

### 返回类型说明

- `getWechatMaterial` / `getWechatTemporaryMaterial` / `getWechatHdVoice`  
  可能返回 `object | Blob`（JSON 或二进制内容）。
- 其余查询与操作接口返回结构化 JSON（包含 `media_id`、`publish_id`、`errcode/errmsg` 等字段）。

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
  publishToWechatDraft
} from "@wenyan-md/core/node";

const { content, title } = await renderStyledContent(markdown);

await publishToWechatDraft({
  title: title ?? "未命名文章",
  content,
});
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

使用`publishToWechatDraft`接口发布文章时，每篇文章顶部需包含 frontmatter：

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
