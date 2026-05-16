import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "../config/config";
import { createArtifactRoute, readArtifactState, writeArtifactState, type ArtifactRoute } from "../state/artifact-state";

type ReviewStateMessage = {
  id?: string;
  role?: string;
  body?: string;
  createdAt?: string;
};

export type ReviewReply = {
  threadId: string;
  body: string;
};

export type ReviewAddOptions = {
  anchorId: string;
  body: string;
  title?: string;
};

export type ReviewReplyOptions = {
  replies: ReviewReply[];
  status?: string;
};

export type ReviewAddResult = {
  anchorId: string;
  statePath: string;
  threadId: string;
};

export type ReviewReplyResult = {
  messageRecords: Array<{ threadId: string; messageId: string }>;
  statePath: string;
};

export type ReviewValidationResult = {
  anchorCount: number;
  missingThreads: ReviewMissingThread[];
  statePath: string;
  threadCount: number;
};

export type ReviewMissingThread = {
  anchorId: string;
  threadId: string;
  title?: string;
  status?: string;
};

export async function addReviewThreadService(
  projectRoot: string,
  input: string,
  options: ReviewAddOptions
): Promise<ReviewAddResult> {
  const artifact = await createArtifactFromInput(projectRoot, input);
  const state = await readArtifactState(artifact);
  const source = await readFile(artifact.sourcePath, "utf8");
  const anchorIds = extractReviewAnchorIds(source);

  if (!anchorIds.has(options.anchorId)) {
    throw new Error(`Review anchor not found: ${options.anchorId}`);
  }

  if (state.threads.some((thread) => isRecord(thread) && thread.anchorId === options.anchorId)) {
    throw new Error(`Review thread already exists for anchor: ${options.anchorId}`);
  }

  const threadId = createThreadId(options.anchorId, state.threads);
  const message = createUserMessage(options.body);
  const thread = {
    id: threadId,
    anchorId: options.anchorId,
    status: "open",
    ...(options.title ? { title: options.title } : {}),
    messages: [message]
  };

  await writeArtifactState(projectRoot, artifact, {
    ...state,
    threads: [...state.threads, thread]
  });

  return {
    anchorId: options.anchorId,
    statePath: artifact.stateRelativePath,
    threadId
  };
}

export async function replyToReviewThreadService(
  projectRoot: string,
  input: string,
  options: ReviewReply & { status?: string }
) {
  return replyToReviewThreadsService(projectRoot, input, {
    replies: [{ threadId: options.threadId, body: options.body }],
    ...(options.status ? { status: options.status } : {})
  });
}

export async function replyToReviewThreadsService(
  projectRoot: string,
  input: string,
  options: ReviewReplyOptions
): Promise<ReviewReplyResult> {
  const artifact = await createArtifactFromInput(projectRoot, input);
  const state = await readArtifactState(artifact);
  const repliesByThread = groupRepliesByThread(options.replies);
  const threadIds = new Set(state.threads.filter(isRecord).map((thread) => thread.id).filter(isString));
  const missingThreadIds = Array.from(repliesByThread.keys()).filter((threadId) => !threadIds.has(threadId));

  if (missingThreadIds.length > 0) {
    throw new Error(`Review thread not found: ${missingThreadIds.join(", ")}`);
  }

  const messageRecords: Array<{ threadId: string; messageId: string }> = [];
  const threads = state.threads.map((thread) => {
    if (!isRecord(thread) || !isString(thread.id)) {
      return thread;
    }

    const replies = repliesByThread.get(thread.id);
    if (!replies) {
      return thread;
    }

    const messages = Array.isArray(thread.messages) ? thread.messages : [];
    const nextMessages = replies.map((reply, index) => createAssistantMessage(reply.body, messageRecords.length + index));
    for (const message of nextMessages) {
      messageRecords.push({ threadId: thread.id, messageId: message.id });
    }

    return {
      ...thread,
      ...(options.status ? { status: options.status } : {}),
      messages: [...messages, ...nextMessages]
    };
  });

  await writeArtifactState(projectRoot, artifact, {
    ...state,
    threads
  });

  return {
    messageRecords,
    statePath: artifact.stateRelativePath
  };
}

export async function validateReviewStateService(projectRoot: string, input: string): Promise<ReviewValidationResult> {
  const artifact = await createArtifactFromInput(projectRoot, input);
  const state = await readArtifactState(artifact);
  const source = await readFile(artifact.sourcePath, "utf8");
  const anchorIds = extractReviewAnchorIds(source);
  const threads = state.threads.filter(isRecord);
  const missingThreads = threads.flatMap<ReviewMissingThread>((thread) => {
    if (!isString(thread.anchorId) || anchorIds.has(thread.anchorId)) {
      return [];
    }

    return [
      {
        anchorId: thread.anchorId,
        threadId: isString(thread.id) ? thread.id : "(missing thread id)",
        title: isString(thread.title) ? thread.title : undefined,
        status: isString(thread.status) ? thread.status : undefined
      }
    ];
  });

  return {
    anchorCount: anchorIds.size,
    missingThreads,
    statePath: artifact.stateRelativePath,
    threadCount: threads.length
  };
}

async function createArtifactFromInput(projectRoot: string, input: string): Promise<ArtifactRoute> {
  const config = await loadConfig(projectRoot);
  const mdxPath = path.resolve(projectRoot, input);
  return createArtifactRoute(projectRoot, mdxPath, config.docsDir);
}

function groupRepliesByThread(replies: ReviewReply[]) {
  const repliesByThread = new Map<string, ReviewReply[]>();

  for (const reply of replies) {
    const threadReplies = repliesByThread.get(reply.threadId) ?? [];
    threadReplies.push(reply);
    repliesByThread.set(reply.threadId, threadReplies);
  }

  return repliesByThread;
}

function createAssistantMessage(body: string, index = 0): Required<Pick<ReviewStateMessage, "id" | "role" | "body" | "createdAt">> {
  return {
    id: `msg_${Date.now().toString(36)}_${index.toString(36)}`,
    role: "assistant",
    body,
    createdAt: new Date().toISOString()
  };
}

function createUserMessage(body: string): Required<Pick<ReviewStateMessage, "id" | "role" | "body" | "createdAt">> {
  return {
    id: `msg_${Date.now().toString(36)}_0`,
    role: "user",
    body,
    createdAt: new Date().toISOString()
  };
}

function createThreadId(anchorId: string, threads: unknown[]) {
  const existingIds = new Set(threads.filter(isRecord).map((thread) => thread.id).filter(isString));
  const base = `thr_${compactId(anchorId)}`;

  if (!existingIds.has(base)) {
    return base;
  }

  for (let index = 2; index < 100; index += 1) {
    const candidate = `${base}_${index}`;
    if (!existingIds.has(candidate)) {
      return candidate;
    }
  }

  return `thr_${compactId(anchorId)}_${Date.now().toString(36)}`;
}

function extractReviewAnchorIds(source: string) {
  const anchorIds = new Set<string>();

  for (const match of source.matchAll(/<([A-Z][A-Za-z0-9.]*)\b[^>]*(?:\sid|\stargetId)\s*=\s*["']([^"']+)["']/g)) {
    if (match[2]) {
      anchorIds.add(match[2]);
    }
  }

  addCompoundChildAnchors(source, anchorIds, "ContentSet", "Item");
  addArrayChildAnchors(source, anchorIds, "AnnotatedCode", "annotations", { addCodeChild: true });
  addComparisonSetChildAnchors(source, anchorIds);

  return anchorIds;
}

function addArrayChildAnchors(
  source: string,
  anchorIds: Set<string>,
  componentName: string,
  arrayPropName: string,
  options: { addCodeChild?: boolean } = {}
) {
  const componentPattern = new RegExp(`<${componentName}\\b[\\s\\S]*?\\/>`, "g");

  for (const match of source.matchAll(componentPattern)) {
    const componentSource = match[0];
    const parentId = extractJsxStringProp(componentSource, "id");
    if (!parentId) {
      continue;
    }

    if (options.addCodeChild) {
      anchorIds.add(`${parentId}.code`);
    }

    const arraySource = extractJsxArrayProp(componentSource, arrayPropName);
    if (!arraySource) {
      continue;
    }

    for (const itemId of extractObjectIds(arraySource)) {
      anchorIds.add(`${parentId}.${itemId}`);
    }
  }
}

function addCompoundChildAnchors(
  source: string,
  anchorIds: Set<string>,
  componentName: string,
  childName: string
) {
  const componentPattern = new RegExp(`<${componentName}\\b[\\s\\S]*?</${componentName}>`, "g");
  const childPattern = new RegExp(`<${componentName}\\.${childName}\\b[^>]*\\sid\\s*=\\s*["']([^"']+)["'][^>]*>`, "g");

  for (const match of source.matchAll(componentPattern)) {
    const componentSource = match[0];
    const parentId = extractJsxStringProp(componentSource, "id");
    if (!parentId) {
      continue;
    }

    for (const childMatch of componentSource.matchAll(childPattern)) {
      if (childMatch[1]) {
        anchorIds.add(`${parentId}.${childMatch[1]}`);
      }
    }
  }
}

function addComparisonSetChildAnchors(source: string, anchorIds: Set<string>) {
  for (const match of source.matchAll(/<ComparisonSet\b[\s\S]*?<\/ComparisonSet>/g)) {
    const componentSource = match[0];
    const parentId = extractJsxStringProp(componentSource, "id");
    if (!parentId) {
      continue;
    }

    for (const itemMatch of componentSource.matchAll(/<ComparisonSet\.Item\b[^>]*\sid\s*=\s*["']([^"']+)["'][^>]*>/g)) {
      if (itemMatch[1]) {
        anchorIds.add(`${parentId}.${itemMatch[1]}`);
      }
    }
  }
}

function extractJsxStringProp(source: string, propName: string) {
  const pattern = new RegExp(`\\b${propName}\\s*=\\s*["']([^"']+)["']`);
  return source.match(pattern)?.[1];
}

function extractJsxArrayProp(source: string, propName: string) {
  const propStart = source.search(new RegExp(`\\b${propName}\\s*=\\s*\\{\\s*\\[`));
  if (propStart < 0) {
    return undefined;
  }

  const arrayStart = source.indexOf("[", propStart);
  let depth = 0;

  for (let index = arrayStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "[") {
      depth += 1;
    } else if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(arrayStart, index + 1);
      }
    }
  }

  return undefined;
}

function extractObjectIds(source: string) {
  return Array.from(source.matchAll(/\bid\s*:\s*["']([^"']+)["']/g), (match) => match[1]).filter(Boolean);
}

function compactId(value: string) {
  const compact = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);

  return compact || "thread";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}
