# Mermaid 图表渲染支持方案（Browser + CLI + Core）

## 1. 结论

最终目标既然是 **浏览器** 和 **CLI** 都要具备 Mermaid 渲染能力，那么 Mermaid 就不应只放在 `src/node/`。  
**Mermaid 能力应该进入 core 层，但进入方式不能简单照抄 MathJax 的实现，而应采用“core 编排 + 环境适配器注入”的架构。**

也就是说：

1. **可以进入 core 层**：让 `createWenyanCore()` 统一负责 Mermaid 代码块识别、渲染时机、错误传播和输出结构。
2. **不建议像 MathJax 一样把具体 Mermaid 渲染实现硬编码进 core**：因为 Mermaid 的 API 和运行时假设比 MathJax 更依赖 DOM / 初始化环境，浏览器与 CLI 的实现细节并不天然一致。

所以推荐的最终方案是：

- `src/core/`：定义 Mermaid 能力接口、接入渲染管线、统一处理代码块替换
- 浏览器环境：提供 browser Mermaid renderer
- CLI / Node 环境：提供 node Mermaid renderer

这样既能让 Mermaid 像 MathJax 一样 **进入 core 渲染链**，又不会把某一个环境的运行时要求硬塞进同构 core。

---

## 2. 为什么不能直接照抄 MathJax

### 2.1 MathJax 当前为什么适合直接在 core 中实现

当前 `src/core/index.ts` 的 MathJax 集成方式比较直接：

```text
Markdown
  ↓
marked -> HTML
  ↓
mathJaxParser.parser(html)
  ↓
HTML string
```

之所以能这样做，是因为当前 MathJax 实现具备几个特点：

1. **输入输出都很稳定**：输入是 HTML string，输出也是 HTML string
2. **core 内部可自给自足**：当前实现通过 `liteAdaptor` + `RegisterHTMLHandler` 即可完成转换
3. **不依赖外部宿主 document**：不需要浏览器 DOM，也不需要 JSDOM 宿主先准备节点树

### 2.2 Mermaid 与 MathJax 的关键差异

Mermaid 官方 API 暴露的是 `initialize()`、`parse()`、`render()`、`run()` 这类能力，其中：

- `run()` 面向 document / 节点扫描
- `render(id, text, svgContainingElement?)` 带有明显的 DOM / Element 语义
- 使用前通常需要初始化配置

这意味着 Mermaid 虽然**可以**进入 core 层，但它不像当前 MathJax 这样天然适合做成一个“纯字符串进、纯字符串出、完全无宿主依赖”的内建 parser。

因此需要明确区分两个问题：

| 问题 | 结论 |
|---|---|
| Mermaid 是否应该进入 core 渲染链？ | **应该** |
| Mermaid 是否应该像 MathJax 一样在 core 里直接绑定唯一实现？ | **不建议，除非 PoC 证明同一实现能稳定覆盖 Browser + CLI** |

---

## 3. 目标架构

### 3.1 总体原则

1. **core 负责“什么时候渲染 Mermaid”**
2. **环境适配器负责“怎么把 Mermaid 代码变成 SVG”**
3. **Browser 和 CLI 走同一条 core 管线**
4. **Mermaid 的输出在应用主题和微信后处理之前完成**

### 3.2 推荐分层

```text
src/core/parser/mermaidParser.ts        ← Mermaid 管线接入与代码块替换（新增）
src/core/types/mermaid.ts               ← Mermaid 抽象接口与配置（新增）
src/core/index.ts                       ← 接入 createWenyanCore（修改）

src/browser/mermaidRenderer.ts          ← 浏览器 Mermaid 渲染实现（新增，若项目决定提供）
src/node/mermaidRenderer.ts             ← CLI/Node Mermaid 渲染实现（新增）

src/node/render.ts                      ← Node 调用 core 时注入 node renderer（修改）
tests/core/*                            ← core 层 Mermaid 测试（新增）
tests/node/*                            ← Node 集成测试（新增）
```

> 如果当前仓库暂时不想新增 `src/browser/` 导出，也可以先只在文档中预留 browser renderer 接口，由浏览器调用方自行注入实现。

### 3.3 职责边界

| 模块 | 职责 |
|---|---|
| `src/core/` | Mermaid 开关、代码块识别、渲染顺序、错误传播、统一输出结构 |
| browser renderer | 浏览器环境下调用 Mermaid API 生成 SVG |
| node renderer | CLI/Node 环境下调用 Mermaid API 生成 SVG |
| `src/node/render.ts` | 组装 Node 侧默认 core 实例 |

---

## 4. 推荐的 core 设计

### 4.1 在 core 中新增 Mermaid 抽象接口

不把第三方 Mermaid API 直接散落到 core，而是在 core 定义稳定接口，例如：

```ts
export interface MermaidRenderContext {
    id: string;
    code: string;
}

export interface MermaidRenderer {
    render(context: MermaidRenderContext): Promise<string>;
}

export interface MermaidOptions {
    enabled?: boolean;
    renderer?: MermaidRenderer;
}
```

### 4.2 `WenyanOptions` 增加 Mermaid 入口

既然目标是 Browser + CLI 都支持，Mermaid 开关就应该进入 core 配置：

```ts
export interface WenyanOptions {
    isConvertMathJax?: boolean;
    isWechat?: boolean;
    mermaid?: boolean | MermaidOptions;
}
```

这里推荐支持两种用法：

1. `mermaid: false`：关闭 Mermaid
2. `mermaid: { enabled: true, renderer }`：启用并注入具体实现

也可以做成：

```ts
mermaidRenderer?: MermaidRenderer;
isRenderMermaid?: boolean;
```

但把它们合成一个 `mermaid` 配置对象可扩展性更好。

### 4.3 core 内部的处理职责

core 不直接关心“当前是浏览器还是 Node”，只做下面几件事：

1. 找出 Mermaid 代码块
2. 取出原始 Mermaid 源码
3. 调用 `renderer.render()`
4. 用统一包装节点替换原始代码块
5. 将结果继续交给现有样式与后处理流程

例如：

```text
Markdown
  ↓
marked -> HTML
  ↓
MathJax（可选）
  ↓
Mermaid（可选，调用注入 renderer）
  ↓
HTML string
  ↓
applyStylesWithTheme()
```

---

## 5. Mermaid 在 core 中的两种实现路径

### 5.1 路径 A：core 编排 + renderer 注入（推荐）

这是最稳的方案。

#### 做法

- core 定义 `MermaidRenderer` 接口
- browser / node 分别实现自己的 renderer
- `createWenyanCore()` 接收 renderer 并统一接入管线

#### 优点

- Browser 和 CLI 共用同一条 core 管线
- core 不被某个环境的 DOM 假设污染
- 测试好做，可以 mock renderer
- 后续如果 Mermaid 官方 API 变化，只需改 adapter

#### 缺点

- 比 MathJax 的当前实现多一层抽象

### 5.2 路径 B：core 直接内建 Mermaid 具体实现（有条件可行）

理论上，如果 PoC 证明：

1. 同一个 Mermaid 包
2. 同一套初始化逻辑
3. 同一套最小 DOM 假设
4. 在 Browser 和 CLI/JSDOM 下都稳定

那么也可以像 MathJax 一样直接把 `createMermaidParser()` 放进 `src/core/parser/`。

但在当前阶段，这条路**风险更高**，因为：

- Mermaid 的 API 语义比 MathJax 更接近“依赖宿主 DOM 的渲染器”
- Browser 和 JSDOM 的表现可能并不完全一致
- 把第三方运行时细节直接放进 core，后续维护成本会更高

### 5.3 最终判断

| 方案 | 是否进入 core | 是否推荐 |
|---|---|---|
| core 直接绑定唯一 Mermaid 实现 | 是 | 暂不推荐，除非 PoC 充分证明稳定 |
| core 只负责编排，renderer 按环境注入 | 是 | **推荐** |

所以答案是：

> **可以让 Mermaid 像 MathJax 一样进入 core 层；但不建议像当前 MathJax 一样把具体实现无条件硬编码进 core。**

---

## 6. 代码块识别与替换策略

### 6.1 不要用正则直接替换 HTML 字符串

原始方案里的这类做法不够稳：

```ts
/<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g
```

原因：

1. 当前代码块类名并不只是 `language-mermaid`，还会有 `hljs`
2. class 顺序、属性顺序、空白符都可能变化
3. HTML 实体反解码靠手写 replace 不完整

### 6.2 推荐做法

在 core 中基于 DOM 处理 Mermaid 代码块：

```ts
const codeBlocks = root.querySelectorAll("pre > code.language-mermaid");
```

源码直接取：

```ts
const code = codeBlock.textContent ?? "";
```

### 6.3 输出包装结构

统一替换为：

```html
<figure data-wenyan-diagram="mermaid">
  <svg>...</svg>
</figure>
```

这样有几个好处：

- core 输出结构稳定
- WeChat 后处理有可靠选择器
- browser / node renderer 的内部差异不会泄漏到外层逻辑

---

## 7. Browser 与 CLI 的实现方式

### 7.1 Browser

浏览器环境下，renderer 可以直接使用浏览器原生 DOM 与 Mermaid API。

可能的职责：

1. 初始化 Mermaid 配置
2. 调用 `parse()` 做语法校验
3. 调用 `render()` 产出 SVG

### 7.2 CLI / Node

CLI 场景本质上仍然是 Node 环境，推荐使用 node renderer 适配：

1. 复用 Mermaid 官方 API
2. 如 Mermaid 渲染需要 DOM，则通过 JSDOM 或等价方案提供最小宿主环境
3. 最终返回 SVG string 给 core

### 7.3 为什么这两端不应直接分叉成两套业务流程

因为用户真正要的是 **同一份 Markdown 在 Browser 和 CLI 上都能渲染 Mermaid**。  
如果 Mermaid 逻辑只写在 Node 里，浏览器就没法共用；如果浏览器单独再实现一套管线，行为很容易漂移。

所以应当把差异收敛到 **renderer 实现**，而不是收敛到 **业务流程**。

---

## 8. 对现有渲染链的接入方式

### 8.1 推荐顺序

```text
Markdown
  ↓
marked 解析
  ↓
MathJax（可选）
  ↓
Mermaid（可选）
  ↓
HTML / DOM
  ↓
applyStylesWithTheme
  ↓
wechatPostRender
```

### 8.2 为什么 Mermaid 放在 MathJax 后面

这样做最容易保持当前思路一致：

- Markdown 先转标准 HTML
- 数学公式先按现有能力处理
- Mermaid 再把特定代码块替换成 SVG
- 样式系统最后统一处理结果树

当然，如果后续 PoC 发现 Mermaid 必须在 DOM 树阶段处理，也可以内部先建 DOM 再替换，但对外管线顺序仍然可以保持这个抽象。

---

## 9. 错误处理

### 9.1 原则

- 不静默降级
- 不在库内 `console.error`
- 渲染失败时直接抛错

例如：

```ts
throw new Error(`Mermaid 图表渲染失败: ${reason}\n片段: ${snippet}`);
```

### 9.2 失败粒度

首版建议仍然采用 **失败即终止整篇渲染**，理由和 MathJax 一致：

- 这是库级行为，应该显式而稳定
- 文档渲染结果不应在出错后看起来“像成功了”

如果后续需要容错模式，再新增显式配置，例如：

```ts
mermaid: {
  enabled: true,
  renderer,
  failMode: "throw" | "fallback"
}
```

---

## 10. WeChat 兼容

如果 Mermaid 最终输出已经统一为：

```html
<figure data-wenyan-diagram="mermaid">...</figure>
```

那么 `wechatPostRender()` 只需要做稳定的 SVG 兼容处理：

```ts
const mermaidSvgs = element.querySelectorAll<SVGSVGElement>('[data-wenyan-diagram="mermaid"] svg');
mermaidSvgs.forEach((svg) => {
    svg.style.maxWidth = "100%";
    svg.style.height = "auto";
});
```

注意：

1. 不要依赖 `svg.mermaid`
2. 不要无依据删除命名空间属性
3. 若 Mermaid 生成了微信不支持的结构，再根据实测做定向清理

---

## 11. 风险与约束

| 风险 | 描述 | 对策 |
|---|---|---|
| 把 Mermaid 仅实现到 Node | 浏览器无法复用 | Mermaid 接入点放在 core |
| 把 Mermaid 具体实现硬塞进 core | core 被环境细节污染 | 使用 renderer 注入 |
| Mermaid 在 Browser / JSDOM 行为不一致 | 双端结果漂移 | 分环境 adapter，统一 core 输出结构 |
| 正则替换 HTML 不稳定 | 容易误替换 | 用 DOM 查询和 `textContent` |
| 失败被吞掉 | 用户拿到“成功形态”的错误结果 | 默认直接抛错 |

---

## 12. 实施计划

### Phase 0：PoC

1. 验证 Mermaid 官方包在 Browser 环境能稳定产出 SVG
2. 验证 Mermaid 官方包在 Node/JSDOM 环境能稳定产出 SVG
3. 明确是否能共用同一个 renderer 实现

### Phase 1：core 接口

1. 新增 `src/core/types/mermaid.ts`
2. 新增 `src/core/parser/mermaidParser.ts`
3. 修改 `src/core/index.ts`，在 `WenyanOptions` 中加入 Mermaid 配置
4. 让 Mermaid 成为 `renderMarkdown()` 管线中的可选步骤

### Phase 2：环境适配

1. 新增 browser Mermaid renderer
2. 新增 node Mermaid renderer
3. `src/node/render.ts` 在创建 core 时注入 node renderer
4. 浏览器侧调用方在创建 core 时注入 browser renderer

### Phase 3：兼容与测试

1. 为 WeChat 渲染补充 Mermaid SVG 通用处理
2. 添加 core 层单元测试
3. 添加 Node 集成测试
4. 添加 browser 集成测试或最小行为测试

### 暂不放进首版范围

1. Mermaid 渲染缓存
2. Mermaid 自定义主题全量开放
3. CLI 参数细化（如 `--no-mermaid`）

---

## 13. 测试建议

### 13.1 core 层

重点不是测试第三方 Mermaid SVG 细节，而是测试：

1. Mermaid 代码块能被识别
2. renderer 会被调用
3. 代码块会被替换成统一包装结构
4. 错误会正确抛出

### 13.2 Node / CLI

断言：

1. 注入 node renderer 后，Mermaid 代码块会被替换为 SVG
2. 未启用 Mermaid 时输出与当前版本一致
3. 主题、脚注、MathJax 不受影响

### 13.3 Browser

断言：

1. 注入 browser renderer 后，Mermaid 代码块会被替换为 SVG
2. 同一份 Markdown 在 browser / CLI 上的包装结构一致
3. 错误传播语义一致

---

## 14. 最终建议

针对现在的目标，文档应明确采用下面这句话作为最终方向：

> **Mermaid 应进入 core 层，但进入的是“抽象能力与渲染管线”，不是某个环境专属的具体实现。**

换句话说：

- 如果目标只有 CLI，放在 `src/node/` 可以接受
- 但既然目标是 **Browser + CLI**，Mermaid 就必须进入 core
- 只是它**不适合完全照抄当前 MathJax 的“单一内建实现”方式**

所以最合理的落地形式是：

**core 统一编排 Mermaid，browser / node 分别提供 renderer。**
