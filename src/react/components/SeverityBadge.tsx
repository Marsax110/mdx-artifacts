export type SeverityLevel = "info" | "low" | "medium" | "high" | "critical";

export type SeverityBadgeProps = {
  level?: SeverityLevel;
  label?: string;
  className?: string;
};

const defaultLabels: Record<SeverityLevel, string> = {
  info: "Info",
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical"
};

export function SeverityBadge({ level = "info", label = defaultLabels[level], className }: SeverityBadgeProps) {
  return <span className={classNames("ak-severity-badge", `ak-severity-badge-${level}`, className)}>{label}</span>;
}

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}
