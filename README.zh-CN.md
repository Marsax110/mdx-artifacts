# MDX Artifacts

一个面向 Agent 的交互式 MDX artifact 工具原型。

目标不是让模型每次生成一整份裸 HTML，而是让模型写较稳定的 MDX：

```mdx
import { DecisionMatrix, ExportPanel } from "../../src/react";

<DecisionMatrix
  question="是否先用 Vite 跑通单 HTML artifact？"
  options={[
    {
      name: "先做 Vite 单页",
      pros: ["闭环短", "更贴近交互工具"],
      cons: ["暂时没有文档站导航"],
      verdict: "第一阶段推荐"
    }
  ]}
/>

<ExportPanel
  title="导出决策"
  formats={["markdown", "json"]}
  value={{ recommendation: "先做单 HTML artifact" }}
/>
```

再由 CLI 输出一个可在浏览器中直接打开的 HTML artifact。

## 当前阶段

第一阶段只做最小闭环：

1. `artifact-docs/**/*.mdx` 作为源文件。
2. `src/react` 提供高阶组件。
3. `src/cli` 提供 `dev`、`build`、`validate`、`init`。
4. CLI 提供 `components` 查询组件参数和示例。
5. `build` 输出单个 self-contained HTML 文件。
6. `InlineText` / `MarkdownBody` 提供受控的文本渲染边界。

暂不把核心绑定到 Astro。Astro 后续只作为“结构化文档站 adapter”加入。

## 命令

安装依赖后：

```bash
pnpm check
pnpm artifact:validate
pnpm artifact:dev
pnpm artifact:build
pnpm storybook
```

查询组件：

```bash
pnpm artifact components
pnpm artifact components ExportPanel
pnpm artifact components --json
```

单文件构建：

```bash
pnpm artifact build artifact-docs/examples/decision-matrix.mdx
```

默认输出：

```text
dist/artifacts/examples/decision-matrix.html
```

组件开发：

```bash
pnpm storybook
```

Storybook 只用于隔离调试 React 组件；最终 artifact 闭环仍以 `artifact-kit validate/build` 为准。

基础测试：

```bash
pnpm test
pnpm typecheck
pnpm artifact:validate
```

## 样式注入

默认情况下，Artifact Kit 会注入内置样式。使用者可以在 `artifact-kit.config.ts` 里追加自己的品牌 CSS：

```ts
import type { ArtifactKitConfig } from "./src/cli/types";

const config: ArtifactKitConfig = {
  docsDir: "artifact-docs",
  outDir: "dist/artifacts",
  includeDefaultStyles: true,
  styles: ["artifact-theme.css"]
};

export default config;
```

`styles` 会在默认样式之后导入，因此可以覆盖 CSS variables 或 `ak-*` class。若要完全接管样式，可以设置 `includeDefaultStyles: false`。

## 设计原则

- 源文件是 MDX，不是裸 HTML。
- 组件 API 要语义化，避免让 Agent 手写布局。
- 交互工具必须提供导出能力。
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
