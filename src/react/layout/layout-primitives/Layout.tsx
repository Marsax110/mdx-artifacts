import type { CSSProperties, ReactNode } from "react";

export type AkGap = "sm" | "md" | "lg";
export type AkCollapseAt = "sm" | "md" | "lg";
export type AkSurface = "none" | "plain" | "subtle" | "outlined";

export type StackProps = {
  children: ReactNode;
  gap?: AkGap;
  align?: "start" | "center" | "stretch";
  className?: string;
};

export type ColumnsRatio = "1:1" | "1:1:1" | "1:1:1:1" | "2:1" | "3:1" | "3:1:1" | "1:3:1" | "1:1:3";

export type ColumnsProps = {
  children: ReactNode;
  ratio?: ColumnsRatio;
  gap?: AkGap;
  collapseAt?: AkCollapseAt;
  className?: string;
};

export type GridProps = {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  gap?: AkGap;
  collapseAt?: AkCollapseAt;
  className?: string;
};

export type SplitPaneRatio = "1:1" | "2:1" | "3:1" | "1:2" | "1:3";

export type SplitPaneProps = {
  children: ReactNode;
  ratio?: SplitPaneRatio;
  gap?: AkGap;
  collapseAt?: AkCollapseAt;
  className?: string;
};

export type FrameProps = {
  children: ReactNode;
  surface?: AkSurface;
  padding?: "none" | AkGap;
  className?: string;
};

export function Stack({ children, gap = "md", align = "stretch", className }: StackProps) {
  return <div className={classNames("ak-stack", `ak-gap-${gap}`, `ak-stack-align-${align}`, className)}>{children}</div>;
}

export function Columns({ children, ratio = "1:1", gap = "md", collapseAt = "md", className }: ColumnsProps) {
  return (
    <div
      className={classNames("ak-columns", `ak-gap-${gap}`, `ak-collapse-${collapseAt}`, className)}
      style={cssVars({ "--ak-layout-columns": ratioToTemplate(ratio) })}
    >
      {children}
    </div>
  );
}

export function Grid({ children, columns = 2, gap = "md", collapseAt = "md", className }: GridProps) {
  return (
    <div
      className={classNames("ak-grid", `ak-gap-${gap}`, `ak-collapse-${collapseAt}`, className)}
      style={cssVars({ "--ak-layout-columns": `repeat(${columns}, minmax(0, 1fr))` })}
    >
      {children}
    </div>
  );
}

export function SplitPane({ children, ratio = "3:1", gap = "md", collapseAt = "md", className }: SplitPaneProps) {
  return (
    <div
      className={classNames("ak-split-pane", `ak-gap-${gap}`, `ak-collapse-${collapseAt}`, className)}
      style={cssVars({ "--ak-layout-columns": ratioToTemplate(ratio) })}
    >
      {children}
    </div>
  );
}

export function Frame({ children, surface = "outlined", padding = "md", className }: FrameProps) {
  return (
    <div className={classNames("ak-frame", `ak-surface-${surface}`, `ak-padding-${padding}`, className)}>
      {children}
    </div>
  );
}

function ratioToTemplate(ratio: ColumnsRatio | SplitPaneRatio) {
  return ratio
    .split(":")
    .map((part) => `${part}fr`)
    .join(" ");
}

function cssVars(values: Record<string, string>) {
  return values as CSSProperties;
}

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}
