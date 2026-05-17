export type ArtifactDiagnostic = {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  sourcePath: string;
  line?: number;
  componentName?: string;
  propName?: string;
  suggestion?: string;
  example?: string;
};
