import { readFile } from "node:fs/promises";
import path from "node:path";
import { createArtifactRoute, readArtifactState, type ArtifactState } from "./artifact-state";
import { loadConfig } from "./config";

type ReviewContextAnchor = {
  id: string;
  component: string;
  snippet: string;
};

type ReviewStateThread = {
  id: string;
  anchorId: string;
  status?: string;
  title?: string;
  messages?: ReviewStateMessage[];
};

type ReviewStateMessage = {
  role?: string;
  body?: string;
  createdAt?: string;
};

const reviewableComponentNames = [
  "Section",
  "DecisionMatrix",
  "OptionGrid",
  "ComparisonSet",
  "ComparisonSet.Item",
  "AnnotatedCode",
  "CodeBlock",
  "DiffBlock",
  "Callout",
  "CommentTarget"
];

export async function reviewCommand(projectRoot: string, args: string[]) {
  const [subcommand, input] = args;

  if (subcommand !== "context") {
    throw new Error("review requires a subcommand. Use `artifact-kit review context <file.mdx>`.");
  }

  if (!input) {
    throw new Error("review context requires a .mdx file path.");
  }

  console.log(await buildReviewContext(projectRoot, input));
}

export async function buildReviewContext(projectRoot: string, input: string) {
  const config = await loadConfig(projectRoot);
  const mdxPath = path.resolve(projectRoot, input);
  const artifact = createArtifactRoute(projectRoot, mdxPath, config.docsDir);
  const [source, state] = await Promise.all([readFile(artifact.sourcePath, "utf8"), readArtifactState(artifact)]);
  const anchors = extractReviewAnchors(source);
  const threads = normalizeThreads(state);

  return [
    "# Artifact Review Context",
    "",
    `source: ${artifact.sourceRelativePath}`,
    `state: ${artifact.stateRelativePath}`,
    `threads: ${threads.length}`,
    "",
    threads.length > 0 ? formatThreads(threads, anchors) : "No review threads."
  ].join("\n").trimEnd();
}

export function extractReviewAnchors(source: string) {
  const anchors = new Map<string, ReviewContextAnchor>();

  for (const componentName of reviewableComponentNames) {
    for (const block of findComponentBlocks(source, componentName)) {
      const id = getComponentAnchorId(block.snippet, componentName);
      if (!id || anchors.has(id)) {
        continue;
      }

      anchors.set(id, {
        id,
        component: componentName,
        snippet: block.snippet.trim()
      });

      for (const childId of getChildAnchorIds(block.snippet, componentName, id)) {
        anchors.set(childId, {
          id: childId,
          component: componentName,
          snippet: block.snippet.trim()
        });
      }
    }
  }

  return anchors;
}

function formatThreads(threads: ReviewStateThread[], anchors: Map<string, ReviewContextAnchor>) {
  return threads.map((thread) => formatThread(thread, anchors)).join("\n\n");
}

function formatThread(thread: ReviewStateThread, anchors: Map<string, ReviewContextAnchor>) {
  const anchor = anchors.get(thread.anchorId);
  const lines = [
    `## Thread ${thread.id}`,
    "",
    `- anchorId: ${thread.anchorId}`,
    `- status: ${thread.status ?? "open"}`,
    `- title: ${thread.title ?? anchor?.id ?? thread.anchorId}`,
    `- anchor: ${anchor ? `${anchor.component} found` : "missing"}`,
    "",
    "### Current MDX",
    "",
    "```mdx",
    anchor?.snippet ?? `Anchor not found for ${thread.anchorId}.`,
    "```",
    "",
    "### Messages",
    "",
    ...formatMessages(thread.messages ?? [])
  ];

  return lines.join("\n").trimEnd();
}

function formatMessages(messages: ReviewStateMessage[]) {
  if (messages.length === 0) {
    return ["No messages."];
  }

  return messages.map((message) => {
    const role = typeof message.role === "string" ? message.role : "unknown";
    const createdAt = typeof message.createdAt === "string" ? ` (${message.createdAt})` : "";
    const body = typeof message.body === "string" && message.body.trim() ? message.body.trim() : "(empty)";
    return `- ${role}${createdAt}: ${body}`;
  });
}

function normalizeThreads(state: ArtifactState): ReviewStateThread[] {
  return state.threads.filter(isReviewStateThread);
}

function isReviewStateThread(value: unknown): value is ReviewStateThread {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.id === "string" && typeof value.anchorId === "string";
}

function findComponentBlocks(source: string, componentName: string) {
  const escapedName = escapeRegExp(componentName);
  const pattern = new RegExp(`<${escapedName}(?=[\\s>])[\\s\\S]*?(?:/>|</${escapedName}>)`, "g");
  return Array.from(source.matchAll(pattern)).map((match) => ({
    index: match.index ?? 0,
    snippet: match[0]
  }));
}

function getComponentAnchorId(snippet: string, componentName: string) {
  const tagEnd = snippet.indexOf(">");
  const openingTag = tagEnd >= 0 ? snippet.slice(0, tagEnd + 1) : snippet;
  const propName = componentName === "CommentTarget" ? "targetId" : "id";
  return getStringProp(openingTag, propName);
}

function getChildAnchorIds(snippet: string, componentName: string, parentId: string) {
  if (componentName === "DecisionMatrix" || componentName === "OptionGrid") {
    return getObjectIds(snippet).map((id) => `${parentId}.${id}`);
  }

  if (componentName === "AnnotatedCode") {
    return [`${parentId}.code`, ...getObjectIds(snippet).map((id) => `${parentId}.${id}`)];
  }

  if (componentName === "ComparisonSet") {
    return getComparisonSetItemIds(snippet).map((id) => `${parentId}.${id}`);
  }

  return [];
}

function getStringProp(source: string, propName: string) {
  const propPattern = new RegExp(`\\s${propName}\\s*=\\s*["']([^"']+)["']`);
  return propPattern.exec(source)?.[1];
}

function getObjectIds(source: string) {
  return Array.from(source.matchAll(/\bid\s*:\s*["']([^"']+)["']/g)).map((match) => match[1]);
}

function getComparisonSetItemIds(source: string) {
  return Array.from(source.matchAll(/<ComparisonSet\.Item(?=[\s>])[\s\S]*?>/g))
    .map((match) => getStringProp(match[0], "id"))
    .filter((id): id is string => Boolean(id));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
