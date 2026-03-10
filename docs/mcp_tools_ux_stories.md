# MCP 工具清单、UX 对比与用户故事覆盖

> 目标：梳理当前仓库可直接用于 MCP Server 的工具能力，并对照用户 UX 习惯设计用户故事，验证调用链路覆盖性。

## 1) MCP 工具清单（按用户任务分组）

以下按“用户会怎么想任务”而非“代码模块名”来组织。

### A. 内容渲染与发布入口（wrapper）

- `getGzhContent`
- `renderAndPublish`
- `renderAndPublishToServer`

### B. 素材与草稿/发布管理（publish）

- 草稿与发布：
  - `publishToWechatDraft`
  - `publishToDraft`
  - `switchWechatDraft`
  - `getWechatDraftCount`
  - `getWechatDraftList`
  - `getWechatDraftDetail`
  - `updateWechatDraft`
  - `deleteWechatDraft`
  - `submitWechatDraft`
  - `getWechatPublishStatus`
  - `getWechatPublishedArticle`
- 永久素材：
  - `getWechatMaterial`
  - `getWechatMaterialCount`
  - `getWechatMaterialList`
  - `uploadWechatArticleImage`
  - `deleteWechatMaterial`
- 临时素材：
  - `uploadWechatTemporaryMaterial`
  - `getWechatTemporaryMaterial`
  - `getWechatHdVoice`

### C. 主题管理（theme）

- `listThemes`
- `addTheme`
- `removeTheme`

### D. Server 中转发布链路（clientPublish）

- `healthCheck`
- `verifyAuth`
- `uploadStyledContent`
- `requestServerPublish`
- `uploadLocalImages`
- `uploadCover`

---

## 2) 与用户 UX 习惯对比

常见 MCP 用户行为习惯：

1. **目标导向**：先说“我要发布/我要查稿/我要删素材”，不关心底层 API 名称。  
2. **低参数负担**：优先少参数、默认值可用，凭据优先自动读取。  
3. **线性工作流**：偏好“先检查 → 再编辑 → 再发布”的可串联链路。  
4. **可观察与可恢复**：希望能查询状态、回看详情、删除错误产物。  

当前实现对比：

- ✅ 已贴合：`publish.ts` 高层函数已按任务语义命名，且复用 token 缓存与环境变量凭据。
- ✅ 已贴合：草稿与素材均具备“查询/修改/删除/发布状态查询”闭环。
- ⚠️ 需要使用方约束：部分接口存在输入格式硬约束（如 `offset/count`、`no_content`、`mediaId`），应在 MCP Tool 描述中使用 TSDoc SPEC 明确。

---

## 3) 用户故事设计（User Stories）

### 用户故事 S1：编辑发布故事（草稿到正式发布）

“作为内容编辑，我希望先确认草稿能力开关和草稿列表，再更新草稿并发布，最后查询发布状态和结果文章。”

推荐调用链路：

`switchWechatDraft(true) -> getWechatDraftCount -> getWechatDraftList -> getWechatDraftDetail -> updateWechatDraft -> submitWechatDraft -> getWechatPublishStatus -> getWechatPublishedArticle`

### 用户故事 S2：素材治理故事（永久素材盘点与清理）

“作为运营同学，我希望统计永久素材数量，分页查看并下钻详情，再删除过期素材。”

推荐调用链路：

`getWechatMaterialCount -> getWechatMaterialList -> getWechatMaterial -> deleteWechatMaterial`

### 用户故事 S3：多媒体上传故事（临时素材与图文内图）

“作为编辑，我希望上传图文内图片与临时语音，随后验证素材可读取（普通/高清）。”

推荐调用链路：

`uploadWechatArticleImage -> uploadWechatTemporaryMaterial -> getWechatTemporaryMaterial -> getWechatHdVoice`

---

## 4) 覆盖验证（测试）

新增测试：`tests/mcpToolStories.test.ts`

- 覆盖 S1/S2/S3 的端到端工具链路编排（通过 mock 底层 WeChat client 验证调用闭环）
- 验证 token 缓存复用（同一故事多步调用仅获取一次 token）
- 验证关键入参与关键返回值可在链路中持续传递

结论：当前 MCP 工具链路可以覆盖上述用户故事。
