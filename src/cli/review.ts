import { readFile } from "node:fs/promises";
import path from "node:path";
import { createArtifactRoute, readArtifactState, writeArtifactState, type ArtifactRoute } from "./artifact-state";
import { loadConfig } from "./config";

type ReviewStateMessage = {
  id?: string;
  role?: string;
  body?: string;
  createdAt?: string;
};

type ReviewReply = {
  threadId: string;
  body: string;
};

type ReviewAddOptions = {
  anchorId: string;
  body: string;
  title?: string;
};

type ReviewReplyOptions = {
  replies: ReviewReply[];
  status?: string;
};

type ParsedReviewReplyArgs = ReviewReplyOptions & {
  input: string;
};

export type ReviewValidationResult = {
  anchorCount: number;
  missingThreads: ReviewMissingThread[];
  output: string;
  threadCount: number;
};

export type ReviewMissingThread = {
  anchorId: string;
  threadId: string;
  title?: string;
  status?: string;
};

export async function reviewCommand(projectRoot: string, args: string[]) {
  const [subcommand] = args;

  if (subcommand === "add") {
    const options = parseReviewAddArgs(args.slice(1));
    console.log(await addReviewThread(projectRoot, options.input, options));
    return;
  }

  if (subcommand === "reply") {
    const options = parseReviewReplyArgs(args.slice(1));
    console.log(await replyToReviewThreads(projectRoot, options.input, options));
    return;
  }

  if (subcommand === "validate") {
    const input = parseReviewValidateArgs(args.slice(1));
    const result = await validateReviewState(projectRoot, input);
    console.log(result.output);
    if (result.missingThreads.length > 0) {
      process.exitCode = 1;
    }
    return;
  }

  throw new Error("review requires a subcommand. Use `artifact-kit review add <file.mdx>`, `artifact-kit review reply <file.mdx>`, or `artifact-kit review validate <file.mdx>`.");
}

export async function addReviewThread(projectRoot: string, input: string, options: ReviewAddOptions) {
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

  return [`review add ok`, `state: ${artifact.stateRelativePath}`, `thread: ${threadId}`, `anchorId: ${options.anchorId}`].join("\n");
}

export async function replyToReviewThread(
  projectRoot: string,
  input: string,
  options: ReviewReply & { status?: string }
) {
  return replyToReviewThreads(projectRoot, input, {
    replies: [{ threadId: options.threadId, body: options.body }],
    ...(options.status ? { status: options.status } : {})
  });
}

export async function replyToReviewThreads(projectRoot: string, input: string, options: ReviewReplyOptions) {
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

  return [
    `review reply ok`,
    `state: ${artifact.stateRelativePath}`,
    `messages: ${messageRecords.length}`,
    ...messageRecords.map((record) => `- thread: ${record.threadId} message: ${record.messageId}`)
  ].join("\n");
}

export async function validateReviewState(projectRoot: string, input: string): Promise<ReviewValidationResult> {
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

  const output =
    missingThreads.length === 0
      ? [
          `review validate ok`,
          `state: ${artifact.stateRelativePath}`,
          `anchors: ${anchorIds.size}`,
          `threads: ${threads.length}`
        ].join("\n")
      : [
          `review validate failed`,
          `state: ${artifact.stateRelativePath}`,
          `anchors: ${anchorIds.size}`,
          `threads: ${threads.length}`,
          `missing: ${missingThreads.length}`,
          ...missingThreads.map((thread) =>
            [
              `- thread: ${thread.threadId}`,
              `anchorId: ${thread.anchorId}`,
              thread.status ? `status: ${thread.status}` : undefined,
              thread.title ? `title: ${thread.title}` : undefined
            ]
              .filter(Boolean)
              .join(" ")
          )
        ].join("\n");

  return {
    anchorCount: anchorIds.size,
    missingThreads,
    output,
    threadCount: threads.length
  };
}

async function createArtifactFromInput(projectRoot: string, input: string): Promise<ArtifactRoute> {
  const config = await loadConfig(projectRoot);
  const mdxPath = path.resolve(projectRoot, input);
  return createArtifactRoute(projectRoot, mdxPath, config.docsDir);
}

function parseReviewReplyArgs(args: string[]): ParsedReviewReplyArgs {
  const [input, ...rest] = args;

  if (!input) {
    throw new Error("review reply requires a .mdx file path.");
  }

  const { replies, status } = parseReviewReplyOptions(rest);

  return {
    input,
    replies,
    ...(status ? { status } : {})
  };
}

function parseReviewValidateArgs(args: string[]) {
  const [input, ...rest] = args;

  if (!input) {
    throw new Error("review validate requires a .mdx file path.");
  }

  if (rest.length > 0) {
    throw new Error(`Unexpected review validate argument: ${rest[0]}`);
  }

  return input;
}

function parseReviewAddArgs(args: string[]) {
  const [input, ...rest] = args;

  if (!input) {
    throw new Error("review add requires a .mdx file path.");
  }

  const options = parseKeyValueOptions(rest, ["anchor", "body", "title"]);
  const anchorId = options.get("anchor");
  const body = options.get("body");
  const title = options.get("title");

  if (!anchorId) {
    throw new Error("review add requires --anchor <anchorId>.");
  }

  if (!body || !body.trim()) {
    throw new Error("review add requires --body <message>.");
  }

  return {
    input,
    anchorId,
    body: body.trim(),
    ...(title ? { title } : {})
  };
}

function parseKeyValueOptions(args: string[], allowedKeys: string[]) {
  const options = new Map<string, string>();

  for (let index = 0; index < args.length; index += 1) {
    const name = args[index];
    if (!name?.startsWith("--")) {
      throw new Error(`Unexpected review argument: ${name}`);
    }

    const key = name.slice(2);
    const value = args[index + 1];
    if (!allowedKeys.includes(key)) {
      throw new Error(`Unknown review option: --${key}.`);
    }
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}.`);
    }

    options.set(key, value);
    index += 1;
  }

  return options;
}

function parseReviewReplyOptions(args: string[]) {
  const replies: ReviewReply[] = [];
  let status: string | undefined;
  let threadId: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const name = args[index];
    if (!name?.startsWith("--")) {
      throw new Error(`Unexpected review reply argument: ${name}`);
    }

    const key = name.slice(2);
    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}.`);
    }

    if (key === "thread") {
      if (threadId) {
        throw new Error(`Missing --body for --thread ${threadId}.`);
      }
      threadId = value;
    } else if (key === "body") {
      if (!threadId) {
        throw new Error("review reply requires --thread before --body.");
      }
      if (!value.trim()) {
        throw new Error("review reply requires --body <message>.");
      }
      replies.push({ threadId, body: value.trim() });
      threadId = undefined;
    } else if (key === "status") {
      status = value;
    } else {
      throw new Error(`Unknown review reply option: --${key}.`);
    }

    index += 1;
  }

  if (threadId) {
    throw new Error(`Missing --body for --thread ${threadId}.`);
  }

  if (replies.length === 0) {
    throw new Error("review reply requires at least one --thread <threadId> --body <message> pair.");
  }

  return { replies, status };
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

  addArrayChildAnchors(source, anchorIds, "DecisionMatrix", "options");
  addArrayChildAnchors(source, anchorIds, "OptionGrid", "options");
  addCompoundChildAnchors(source, anchorIds, "DecisionMatrix", "Option");
  addCompoundChildAnchors(source, anchorIds, "OptionGrid", "Item");
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
