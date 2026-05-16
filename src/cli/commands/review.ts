import {
  addReviewThreadService,
  replyToReviewThreadsService,
  validateReviewStateService,
  type ReviewAddOptions,
  type ReviewAddResult,
  type ReviewReply,
  type ReviewReplyOptions,
  type ReviewReplyResult,
  type ReviewValidationResult
} from "../services/review";

type ParsedReviewAddArgs = ReviewAddOptions & {
  input: string;
};

type ParsedReviewReplyArgs = ReviewReplyOptions & {
  input: string;
};

export async function reviewCommand(projectRoot: string, args: string[]) {
  const [subcommand] = args;

  if (subcommand === "add") {
    const options = parseReviewAddArgs(args.slice(1));
    const result = await addReviewThreadService(projectRoot, options.input, options);
    console.log(formatReviewAddResult(result));
    return;
  }

  if (subcommand === "reply") {
    const options = parseReviewReplyArgs(args.slice(1));
    const result = await replyToReviewThreadsService(projectRoot, options.input, options);
    console.log(formatReviewReplyResult(result));
    return;
  }

  if (subcommand === "validate") {
    const input = parseReviewValidateArgs(args.slice(1));
    const result = await validateReviewStateService(projectRoot, input);
    console.log(formatReviewValidationResult(result));
    if (result.missingThreads.length > 0) {
      process.exitCode = 1;
    }
    return;
  }

  throw new Error(
    "review requires a subcommand. Use `artifact-kit review add <file.mdx>`, `artifact-kit review reply <file.mdx>`, or `artifact-kit review validate <file.mdx>`."
  );
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

function parseReviewAddArgs(args: string[]): ParsedReviewAddArgs {
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

function formatReviewAddResult(result: ReviewAddResult) {
  return [`review add ok`, `state: ${result.statePath}`, `thread: ${result.threadId}`, `anchorId: ${result.anchorId}`].join(
    "\n"
  );
}

function formatReviewReplyResult(result: ReviewReplyResult) {
  return [
    `review reply ok`,
    `state: ${result.statePath}`,
    `messages: ${result.messageRecords.length}`,
    ...result.messageRecords.map((record) => `- thread: ${record.threadId} message: ${record.messageId}`)
  ].join("\n");
}

function formatReviewValidationResult(result: ReviewValidationResult) {
  return result.missingThreads.length === 0
    ? [
        `review validate ok`,
        `state: ${result.statePath}`,
        `anchors: ${result.anchorCount}`,
        `threads: ${result.threadCount}`
      ].join("\n")
    : [
        `review validate failed`,
        `state: ${result.statePath}`,
        `anchors: ${result.anchorCount}`,
        `threads: ${result.threadCount}`,
        `missing: ${result.missingThreads.length}`,
        ...result.missingThreads.map((thread) =>
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
}
