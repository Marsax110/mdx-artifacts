# MDX Artifacts 设计说明

## 语言策略

面向开源和 npm 发布时，项目语言边界如下：

- 代码、类型、运行时 UI、CLI 输出、错误信息使用英文。
- `componentRegistry` 使用英文，因为它会被 CLI、Agent 和未来文档生成共同消费。
- `artifact-docs/examples` 使用英文，作为开源示例和测试素材。
- `agents/AGENTS.snippet.md` 使用英文，避免下发给用户项目后造成语言预设。
- `README.md` 英文优先，中文内容放在 `README.zh-CN.md`。
- `docs/design.md` 英文优先，中文设计备忘放在 `docs/design.zh-CN.md`。

这个约定的目标是：开源用户看到的默认行为是英文，同时保留中文文档服务当前产品和架构讨论。

## 背景

HTML artifact 的价值不在于替代 Markdown，而在于把一些阅读、比较、调参、排序、导出类任务变成可操作界面。

直接让 Agent 生成裸 HTML 有几个问题：

- Token 成本高。
- 样式和交互重复生成。
- 导出逻辑不稳定。
- HTML diff 不适合长期维护。
- 一次性页面难以沉淀成工作流资产。

本项目的判断是：保留 MDX 作为源文件，让 Agent 调用预置高阶组件，最终编译成 HTML artifact。

## 三层架构

### 1. 组件协议层

核心资产是高阶组件和数据协议，而不是某个前端框架壳。

第一批组件：

- `InlineText`：单行短文本，支持受控 inline Markdown。
- `MarkdownBody`：组件内部正文，支持受控 block Markdown。
- `DecisionMatrix`：方案比较。
- `OptionGrid`：多个方案并排展示。
- `ExportPanel`：导出 Markdown / JSON。

后续组件：

- `PriorityBoard`：任务拖拽排序。
- `PromptWorkbench`：提示词变量和样例预览。
- `DiffExplainer`：PR / diff 解释。
- `ParameterTuner`：参数调试器。

### 2. 构建层

第一阶段使用 Vite + React + MDX：

```text
artifact-docs/foo.mdx
  -> Vite bundle
  -> inline JS/CSS/assets
  -> dist/artifacts/foo.html
```

这个阶段的目标是验证单个 HTML artifact 闭环，不做文档站。

### 3. 文档站层

第二阶段提供 Astro template：

```text
artifact-docs/
  decisions/auth.mdx
  pr-reviews/backpressure.mdx

-> Astro adapter

dist/site/
  decisions/auth/index.html
  pr-reviews/backpressure/index.html
```

Astro 适合长期文档库，但不应该决定核心组件 API。

## 为什么不先绑定 Astro

Astro 的优点：

- MDX 文件天然适合作为页面。
- 多页面、layout、frontmatter、静态输出更完整。
- 适合长期开发文档站。

Astro 的代价：

- 对一次性交互工具偏重。
- Agent 需要理解 `client:*` 这类 Astro 特有规则。
- 高阶组件本身不应该依赖 Astro。

所以当前策略是：

```text
核心资产：React 高阶组件 + exporter 协议
第一出口：Vite 单 HTML artifact
第二出口：Astro 文档站
```

## UI 依赖边界

当前采用“Tailwind + Radix primitives”的轻量路线。

## 样式协议

Artifact Kit 提供默认 CSS，但默认样式不是闭环的一部分。

使用者可以通过 `artifact-kit.config.ts` 注入品牌样式：

```ts
const config = {
  docsDir: "artifact-docs",
  outDir: "dist/artifacts",
  includeDefaultStyles: true,
  styles: ["artifact-theme.css"]
};
```

约定：

- `includeDefaultStyles: true` 时，先导入 Artifact Kit 默认样式。
- `styles` 按数组顺序在默认样式之后导入。
- 使用者可以通过覆盖 CSS variables 或 `ak-*` class 调整品牌。
- `includeDefaultStyles: false` 表示完全接管样式。
- CLI 构建仍会把最终 CSS 内联到单文件 HTML。

### Tailwind 的角色

Tailwind 是 artifact-kit 内部的样式生产工具，不要求用户项目自己配置 Tailwind。

### Radix 的角色

Radix 只作为按需引入的 headless primitives，用于 Tabs、Dialog、Tooltip、Select、Accordion 这类复杂交互。

第一阶段只在 `ExportPanel` 中使用 `@radix-ui/react-tabs` 验证集成边界。

## 组件开发方式

当前引入 Storybook 作为开发依赖，用于隔离调试 React 高阶组件。

Storybook 不负责：

- 编译 MDX artifact。
- 输出单文件 HTML。
- 管理 Agent 工作流。
- 替代后续 Astro 文档站。

因此当前工作方式是：

```text
组件开发：pnpm storybook
协议验证：pnpm typecheck / pnpm test / pnpm artifact:validate
artifact 验证：pnpm artifact:build
```

## 测试协议

第一版测试基线先保护组件协议，不直接进入浏览器 E2E。

当前覆盖：

- registry 元数据约束
- `InlineText` / `MarkdownBody` 的受控 Markdown 渲染
- CLI 组件查询输出
- MDX validate 规则

具体测试路径见 `docs/testing.md`。

第一版暂不覆盖：

- 浏览器 E2E
- 视觉回归
- Astro adapter 测试
- npm tarball 安装 smoke test

## Agent 使用约定

Agent 生成 artifact 时应该遵守：

1. 优先创建 `.mdx` 文件，不直接写裸 HTML。
2. 优先使用已有高阶组件，不临时重写同类 UI。
3. 交互型 artifact 必须提供导出入口。
4. 大型数据后续应拆到相邻 `.json`。
5. 不确定组件参数时运行 `artifact-kit components <ComponentName>`。
6. 需要机器可读元数据时运行 `artifact-kit components --json`。
7. 构建前运行 `artifact-kit validate <file.mdx>`。
8. 单页输出运行 `artifact-kit build <file.mdx>`。

## CLI 查询协议

为了减少 skill、AGENTS.md、CLAUDE.md 中的冗余组件说明，CLI 提供组件查询能力：

```bash
artifact-kit components
artifact-kit components ExportPanel
artifact-kit components --json
artifact-kit components ExportPanel --json
```

查询数据来自 `componentRegistry`，未来应同时服务 CLI 查询、Storybook docs、validate 规则和 Agent skill 说明。

## 公开路线图与本地执行记录

公开项目方向放在：

- `ROADMAP.md`
- `docs/design.md`
- `docs/naming.md`
- `docs/component-protocol.md`
- `docs/component-taxonomy.md`
- `docs/testing.md`

本地阶段执行记录放在 `docs/local/*.local.md`，不提交到开源仓库。它用于记录临时判断、验收过程和 Agent 工作状态，避免把过程噪音暴露到公开文档中。
