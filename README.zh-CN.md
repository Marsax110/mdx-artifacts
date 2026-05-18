# MDX Artifacts

一个面向 Agent 的交互式 MDX artifact 工具。

目标不是让模型每次生成一整份裸 HTML，也不是让模型在 MDX 里写一个 React app DSL。目标是让源文件保持 Markdown-native，同时用稳定的高阶组件表达语义岛：

```mdx
import { ContentSet, ExportPanel } from "mdx-artifacts/react";

<ContentSet
  id="set.stage-one"
  title="是否先用 Vite 跑通单 HTML artifact？"
  columns={3}
>
  <ContentSet.Item
    id="vite"
    title="先做 Vite 单页"
    badge="第一阶段推荐"
    tone="positive"
    emphasis="primary"
    summary="先验证从 Markdown-native source 到交互式 HTML 的最短闭环。"
  >
    ### 取舍

    - 闭环短
    - 更贴近交互工具
    - 暂时没有文档站导航
  </ContentSet.Item>
</ContentSet>

<ExportPanel
  title="导出决策"
  formats={["markdown", "json"]}
  value={{ recommendation: "先做单 HTML artifact" }}
/>
```

再由 CLI 输出一个可在浏览器中直接打开的 HTML artifact。

## 写作哲学

MDX Artifacts 是一个 Markdown-native 的 artifact system。

源文件应该读起来像文档；输出文件可以表现为更强的交互式 HTML artifact。组件应该是文档中的语义岛，而不是把整篇文档替换成一个巨大的 JSX 配置对象。

做组件和写 artifact 时，用这组边界做判断：

- 叙事内容、解释、长描述、列表、可 review 的正文，优先使用原生 Markdown 或 MDX children。
- 决策、对比、代码 review、导出交接、交互状态等结构化工作流区域，使用语义组件。
- 稳定 id、短标签、枚举设置、布局控制、机器可读 value、真正的数据结构，继续使用 props。
- 不要把所有语义都挪进隐式 Markdown parser。标题、列表、表格不应该在没有显式组件 slot 的情况下偷偷变成组件数据。
- 不要把 artifact source 写成 React 应用源码。如果一个 artifact 需要任意状态 UI、项目级 CSS 或应用级交互，应使用专门的 web artifact builder 或项目本地组件。

因此，新组件 API 默认应该是：人类可读内容 children-first，机器可读配置 props-first。

## 什么时候使用

当 agent 需要创建一个本地、可 review、可验证、最终能输出独立 HTML 的 MDX artifact 时，适合使用 MDX Artifacts。

适合的场景：

- 决策报告、方案对比、代码 review 交接、实施计划。
- 源文件仍需要保持 MDX 可读性。
- 希望 agent 先查询组件 metadata，再 validate，最后 build。
- 需要项目本地 React 组件补充能力，但主体仍然是 MDX 文档。

不适合的场景：普通 README、简单笔记、裸 HTML 页面、完整 web app，或者需要任意应用状态和自定义运行时代码的 artifact。

## 0.2.0 破坏性变更

`DecisionMatrix` 和 `OptionGrid` 已从公开 API 中移除。成组内容卡片请使用 `ContentSet`，独立内容卡片请使用 `ContentItem`。

这次变更的目标是统一内容写作模型：解释、理由、优缺点、风险和取舍这类可读正文，应该放在 MDX children 中，而不是继续塞进对象数组 props。

推荐写法：

```mdx
<ContentSet id="set.path" title="选择实现路径" columns={3}>
  <ContentSet.Item
    id="path-a"
    title="路径 A"
    badge="推荐"
    tone="positive"
    emphasis="primary"
    summary="适合作为第一步。"
  >
    ### 取舍

    - MDX source 更容易阅读
    - 长解释可以继续保留 Markdown 结构
  </ContentSet.Item>
</ContentSet>
```

不要再使用 `DecisionMatrix`、`DecisionMatrix.Option`、`OptionGrid`、`OptionGrid.Item` 或 `options={[...]}`。`validate` 命令会对这些已移除组件，以及 `question`、`name`、`intent`、`pros`、`cons`、`risks`、`confidence`、`verdict`、`tradeoffs` 等旧 props 给出迁移 warning。

## 当前阶段

第一阶段只做最小闭环：

1. 配置里的 `docsDir` 是 MDX 源文件根目录，默认是 `artifact-docs/`。
2. `mdx-artifacts/react` 导出高阶 artifact 组件。
3. `mdx-artifacts` CLI 提供 `init`、`components`、`validate`、`dev`、`build` 和窄口径 review-state 命令。
4. `mdx-artifacts components` 暴露组件参数和示例，供 agent 查询。
5. `build` 输出单个 self-contained HTML 文件。
6. `InlineText` / `MarkdownBody` 提供受控的文本渲染边界。

暂不把核心绑定到 Astro。Astro 后续只作为“结构化文档站 adapter”加入。

## 从 npm 安装

对 npm 使用者来说，最短的首次使用路径是：

```bash
npm install --save-dev mdx-artifacts
npx mdx-artifacts init
npx mdx-artifacts validate artifact-docs/examples/hello.mdx
npx mdx-artifacts build artifact-docs/examples/hello.mdx
```

最后一条命令会输出：

```text
dist/artifacts/examples/hello.html
```

如果使用 pnpm，在需要生成本地 artifacts 的项目中安装：

```bash
pnpm add -D mdx-artifacts
```

如果是在 pnpm workspace root 安装，需要显式加 `-w`：

```bash
pnpm add -Dw mdx-artifacts
```

React 和 React DOM 是 peer dependencies。现代包管理器通常会为这个开发工具链自动安装它们；如果你的项目关闭了 peer dependency 自动安装，再显式补上：

```bash
npm install --save-dev mdx-artifacts react react-dom
pnpm add -D mdx-artifacts react react-dom
```

初始化工作区：

```bash
npx mdx-artifacts init
pnpm exec mdx-artifacts init
```

交互式初始化会使用编号选项。直接回车表示接受默认值：

```text
Where should MDX artifact source files live?
  1. ./artifact-docs/ (default)
  2. Enter a custom directory
Select an option (1)

Use project-local React components?
  Adds a Tailwind source directory; it does not auto-register components.
  1. No (default)
  2. Yes, choose a project-local component source directory
Select an option (1)
```

非交互初始化时，可以显式传入项目结构：

```bash
pnpm exec mdx-artifacts init --yes --docs-dir docs/artifacts --components-dir artifact-components --agent codex
```

初始化完成后，CLI 会输出 summary，列出已选择的目录、生成的 agent guidance 文件，以及下一步 validate/build 命令。脚手架会包含：

```text
mdx-artifacts.config.mjs
<docsDir>/examples/hello.mdx
agents/AGENTS.snippet.md
```

`components-dir` 是项目本地组件源码目录，会写入 `tailwindSources` 供 Tailwind 扫描 class，但不等于自动注册组件，也不会让组件自动出现在 `mdx-artifacts components` 中。

### Agent Guidance

`mdx-artifacts init --agent <agent>` 可以安装项目本地的 agent 写作指导：

```text
--agent codex       .agents/skills/mdx-artifacts/SKILL.md
--agent claude-code .claude/skills/mdx-artifacts/SKILL.md
--agent cursor      .cursor/rules/mdx-artifacts.mdc
--agent all         安装所有支持的项目本地 guidance 文件
```

这些 guidance 会告诉 agent：什么时候使用 MDX Artifacts、`.mdx` 文件应该放在哪里、如何查询组件 metadata、如何处理本地资源，并要求 agent 在 build 前先运行 `mdx-artifacts validate`。组件 props 的真相来源仍然是 CLI registry，不应该把大段组件 metadata 复制进 agent instructions。

验证和构建初始化示例。默认初始化时，示例文件位于 `artifact-docs/`：

```bash
pnpm exec mdx-artifacts validate artifact-docs/examples/hello.mdx
pnpm exec mdx-artifacts build artifact-docs/examples/hello.mdx
```

如果初始化时传入了自定义 `--docs-dir`，请改用 `<docsDir>/examples/hello.mdx`。

开发服务模式：

```bash
pnpm exec mdx-artifacts dev artifact-docs/examples/hello.mdx
```

## CLI

查询组件：

```bash
pnpm exec mdx-artifacts components
pnpm exec mdx-artifacts components ExportPanel
pnpm exec mdx-artifacts components --json
```

单文件构建：

```bash
pnpm exec mdx-artifacts build artifact-docs/examples/hello.mdx
```

## Review State

MDX Artifacts 可以把本地 review threads 保存在 MDX 文件旁边的 sibling `.state.json` 文件中：

```text
artifact-docs/examples/hello.mdx
artifact-docs/examples/hello.state.json
```

在 MDX 中使用稳定 anchor，可以让 review threads 在编辑后继续定位：

```mdx
import { ContentSet, Section } from "mdx-artifacts/react";

<Section id="section.context">

## Context

Native MDX prose can be reviewed through the section anchor.

</Section>

<ContentSet
  id="set.stage-one"
  title="Should this artifact use stable anchors?"
  columns={2}
>
  <ContentSet.Item id="yes" title="Use stable anchors" badge="Recommended" tone="positive" emphasis="primary">
    Stable child anchors keep review threads attached across edits.
  </ContentSet.Item>
</ContentSet>
```

Agent 可以新增 thread、追加 assistant reply，并验证 state 中的 anchor 是否仍存在于当前 MDX：

```bash
pnpm exec mdx-artifacts review add artifact-docs/examples/hello.mdx \
  --anchor set.stage-one \
  --body "Clarify this decision."

pnpm exec mdx-artifacts review reply artifact-docs/examples/hello.mdx \
  --thread thr_set_stage_one \
  --body "Updated the decision copy." \
  --status resolved

pnpm exec mdx-artifacts review validate artifact-docs/examples/hello.mdx
```

Review 命令读写源 MDX 的 sibling `.state.json` 文件，不会直接修改 MDX source。`review validate` 会检查已保存的 review threads 是否仍然指向当前 MDX 中存在的 anchors。

如果 anchor 从 MDX 中移除，浏览器 review layer 会把对应 thread 保留为 unplaced comment，而不是删除它；CLI 也会报告同类问题。

## 仓库开发

安装依赖后：

```bash
pnpm install
```

验证并构建仓库示例 artifact：

```bash
pnpm check
pnpm mdx-artifacts:validate
pnpm mdx-artifacts:build
```

组件开发：

```bash
pnpm storybook
```

Storybook 只用于隔离调试 React 组件；最终 artifact 闭环仍以 `mdx-artifacts validate/build` 为准。

基础测试：

```bash
pnpm test
pnpm typecheck
pnpm mdx-artifacts:validate
```

发布前或修改 package metadata、公开文档、examples、agent guidance 后，运行轻量 release 检查：

```bash
pnpm release:check
```

发布前或修改 package 边界、CLI 输出、config loading、scaffold、依赖边界、build output 后，运行 package smoke test：

```bash
pnpm pack:smoke
```

最终手动发布前，可以再运行：

```bash
npm pack --dry-run --cache /private/tmp/mdx-artifacts-npm-cache
```

## 样式注入

默认情况下，MDX Artifacts 会注入内置样式。使用者可以在 `mdx-artifacts.config.mjs` 里追加自己的品牌 CSS：

```js
/** @type {import("mdx-artifacts").MdxArtifactsConfig} */
const config = {
  docsDir: "artifact-docs",
  outDir: "dist/artifacts",
  includeDefaultStyles: true,
  styles: ["artifact-theme.css"],
  tailwindSources: ["artifact-components/**/*.{ts,tsx}"]
};

export default config;
```

`styles` 会在默认样式之后导入，因此可以覆盖 CSS variables 或 `ak-*` class。若要关闭 MDX Artifacts 默认样式，可以设置 `includeDefaultStyles: false`。

CLI 会自动把当前 MDX 文件注册为 Tailwind source，因此本地 MDX 组件里的 Tailwind utility class 会在 artifact 构建时生成。若 MDX import 了项目本地组件，并且这些组件文件里也写了 Tailwind class，可以用 `tailwindSources` 显式注册这些路径。

## 本地资源和安全模型

MDX Artifacts 面向项目工作区内生成的本地、可 review artifact。

- 已接入 resource policy 的本地资源路径必须留在 project root 内。
- 已接入 resource policy 的远程 URL、`~` 路径、逃逸 project root 的路径会被拒绝。
- 当前 `validate` 会检查配置中的 `styles` 资源；data、artifact、component-module 引用后续成为一等输入时，可以接入同一套策略。
- `tailwindSources` 用于 Tailwind class 扫描，应该只指向项目本地源码文件；它是配置约定，不是组件注册机制。
- `componentsDir` 是用户自有 React 组件的源码位置，不是组件注册表。
- 原生 React import 仍然只是普通 MDX import；只有内置语义组件不够用时，才使用项目本地组件。
- build 前建议先运行 `mdx-artifacts validate <file.mdx>`，提前暴露当前支持的路径、组件和诊断问题。

## 设计原则

- 源文件是 MDX，不是裸 HTML。
- 源文件应该保持 Markdown-native；输出可以是更丰富的交互式 HTML。
- 组件是文档中的语义岛，不是整个写作模型。
- 组件 API 要语义化，避免让 Agent 手写布局。
- 人类可读正文优先使用 MDX children 或显式 slot，不要长期塞在长字符串 props 中。
- props 适合承载 id、短标签、变体、布局控制和结构化数据。
- 交互工具应该提供导出能力；缺失时 `validate` 会给出 warning。
- 大数据后续应放到相邻 JSON 文件，不要塞进 MDX props。
- 核心组件保持 React/TypeScript，可被 Vite、Astro、Claude artifact builder 复用。
- Tailwind 作为内部样式构建能力，最终仍输出内联 CSS 的单 HTML。
- Radix 只按需用于复杂交互 primitives，不把 shadcn/ui 或 daisyUI 作为核心依赖。
- 基础测试覆盖 registry 元数据、受控文本渲染、CLI 组件查询和 MDX validate。

## 后续阶段

- [公开路线图](ROADMAP.md)
- [设计说明](docs/design.zh-CN.md)
- [英文命名规范](docs/naming.md)
- [英文组件协议](docs/component-protocol.md)
- [英文组件分类](docs/component-taxonomy.md)
- [英文测试协议](docs/testing.md)
