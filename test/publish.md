---
title: 自动化测试
cover: test/wenyan.jpg
---

文颜 MCP Server 是一个基于模型上下文协议（Model Context Protocol, MCP）的服务器组件，支持将 Markdown 格式的文章发布至微信公众号草稿箱，并使用与 文颜 相同的主题系统进行排版。

## 使用方式

- 方式一：本地运行
- 方式二：使用 Docker 运行（推荐）

![](test/result_image.jpg)

```
# .npmignore

# 忽略所有 dist 目录下的 .map 文件
dist/**/*.map
```

## 2.12 公式

### 行内公式

比如这个化学公式：$\ce{Hg^2+ ->[I-] HgI2 ->[I-] [Hg^{II}I4]^2-}$，啦啦啦

### 块公式

$$
H(D_2) = -\left(\frac{2}{4}\log_2 \frac{2}{4} + \frac{2}{4}\log_2 \frac{2}{4}\right) = 1
$$

### 矩阵

$$
\begin{pmatrix}
  1 & a_1 & a_1^2 & \cdots & a_1^n \\
  1 & a_2 & a_2^2 & \cdots & a_2^n \\
  \vdots & \vdots & \vdots & \ddots & \vdots \\
  1 & a_m & a_m^2 & \cdots & a_m^n \\
  \end{pmatrix}
$$

### 待解决

- $a^2 + b^2 = c^2$ : aaa
- $a^2 + b^2 = c^2$ : aaa
