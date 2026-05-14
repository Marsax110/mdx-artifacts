import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ArtifactStateProviderProps = {
  children: ReactNode;
};

export type ArtifactStateMeta = {
  sourcePath: string;
  statePath: string;
  writable: boolean;
};

export type ArtifactStateValue = {
  version: number;
  source: string;
  threads: ArtifactStateThread[];
  interactions: Record<string, unknown>;
  [key: string]: unknown;
};

export type ArtifactStateThread = {
  id: string;
  anchorId: string;
  status: string;
  title?: string;
  description?: string;
  messages: ArtifactStateMessage[];
  [key: string]: unknown;
};

export type ArtifactStateMessage = {
  id: string;
  role: "user" | "assistant";
  body: string;
  createdAt?: string;
  [key: string]: unknown;
};

export type ArtifactStateComment = {
  id: string;
  blockId: string;
  blockTitle: string;
  blockDescription?: string;
  comment: string;
  createdAt: string;
};

export type ArtifactStateStatus = "loading" | "static" | "ready" | "saving" | "saved" | "error";

type ArtifactStateContextValue = {
  state?: ArtifactStateValue;
  actions: {
    saveComments: (comments: ArtifactStateComment[]) => Promise<void>;
    saveState: (state: unknown) => Promise<void>;
  };
  meta: {
    daemon?: ArtifactStateMeta;
    status: ArtifactStateStatus;
  };
};

const ArtifactStateContext = createContext<ArtifactStateContextValue | null>(null);

export function ArtifactStateProvider({ children }: ArtifactStateProviderProps) {
  const [daemonMeta, setDaemonMeta] = useState<ArtifactStateMeta | undefined>();
  const [state, setState] = useState<ArtifactStateValue | undefined>();
  const [status, setStatus] = useState<ArtifactStateStatus>("loading");

  useEffect(() => {
    let active = true;

    async function loadArtifactState() {
      if (typeof fetch !== "function") {
        setStatus("static");
        return;
      }

      try {
        const metaResponse = await fetch("/__artifact/meta", { headers: { accept: "application/json" } });
        if (!metaResponse.ok) {
          setStatus("static");
          return;
        }

        const nextMeta = await metaResponse.json();
        if (!isArtifactStateMeta(nextMeta) || !nextMeta.writable) {
          setStatus("static");
          return;
        }

        const stateResponse = await fetch("/__artifact/state", { headers: { accept: "application/json" } });
        const nextState = stateResponse.ok ? normalizeArtifactState(await stateResponse.json(), nextMeta.sourcePath) : createEmptyArtifactState(nextMeta.sourcePath);

        if (active) {
          setDaemonMeta(nextMeta);
          setState(nextState);
          setStatus("ready");
        }
      } catch {
        if (active) {
          setStatus("static");
        }
      }
    }

    loadArtifactState();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<ArtifactStateContextValue>(
    () => ({
      state,
      actions: {
        async saveComments(comments) {
          if (!daemonMeta) {
            return;
          }

          const nextState = createArtifactStateFromComments(comments, state, daemonMeta.sourcePath);
          await saveArtifactState(nextState, daemonMeta, setStatus, setState);
        },
        async saveState(nextState) {
          if (!daemonMeta) {
            return;
          }

          await saveArtifactState(normalizeArtifactState(nextState, daemonMeta.sourcePath), daemonMeta, setStatus, setState);
        }
      },
      meta: {
        daemon: daemonMeta,
        status
      }
    }),
    [daemonMeta, state, status]
  );

  return <ArtifactStateContext.Provider value={value}>{children}</ArtifactStateContext.Provider>;
}

export function useOptionalArtifactState() {
  return useContext(ArtifactStateContext);
}

export function createArtifactStateFromComments(
  comments: ArtifactStateComment[],
  currentState: unknown,
  sourcePath: string
): ArtifactStateValue {
  const baseState = normalizeArtifactState(currentState, sourcePath);
  const commentThreads = comments.map((comment) => createThreadFromComment(comment, baseState.threads));
  const commentAnchorIds = new Set(commentThreads.map((thread) => thread.anchorId));
  const retainedThreads = baseState.threads.filter((thread) => !commentAnchorIds.has(thread.anchorId));

  return {
    ...baseState,
    source: sourcePath,
    threads: [...retainedThreads, ...commentThreads]
  };
}

export function createArtifactCommentsFromState(value: unknown): ArtifactStateComment[] {
  if (!isRecord(value) || !Array.isArray(value.threads)) {
    return [];
  }

  return value.threads.flatMap((thread) => createArtifactCommentFromThread(thread));
}

async function saveArtifactState(
  nextState: ArtifactStateValue,
  daemonMeta: ArtifactStateMeta,
  setStatus: (status: ArtifactStateStatus) => void,
  setState: (state: ArtifactStateValue) => void
) {
  setStatus("saving");

  try {
    const response = await fetch("/__artifact/state", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(nextState)
    });

    if (!response.ok) {
      throw new Error("Failed to save artifact state.");
    }

    const payload = await response.json();
    const savedState = isRecord(payload) && "state" in payload ? payload.state : nextState;
    setState(normalizeArtifactState(savedState, daemonMeta.sourcePath));
    setStatus("saved");
    window.setTimeout(() => setStatus("ready"), 1200);
  } catch {
    setStatus("error");
  }
}

function normalizeArtifactState(value: unknown, sourcePath: string): ArtifactStateValue {
  if (!isRecord(value)) {
    return createEmptyArtifactState(sourcePath);
  }

  return {
    ...value,
    version: typeof value.version === "number" ? value.version : 1,
    source: sourcePath,
    threads: normalizeThreads(value.threads),
    interactions: isRecord(value.interactions) ? value.interactions : {}
  };
}

function createEmptyArtifactState(sourcePath: string): ArtifactStateValue {
  return {
    version: 1,
    source: sourcePath,
    threads: [],
    interactions: {}
  };
}

function createThreadFromComment(comment: ArtifactStateComment, currentThreads: ArtifactStateThread[]): ArtifactStateThread {
  const currentThread = currentThreads.find((thread) => thread.anchorId === comment.blockId);
  const currentMessages = currentThread?.messages ?? [];
  const currentUserMessage = currentMessages.find((message) => message.role === "user");
  const userMessage: ArtifactStateMessage = {
    ...currentUserMessage,
    id: currentUserMessage?.id ?? `msg-${comment.id}`,
    role: "user",
    body: comment.comment,
    createdAt: currentUserMessage?.createdAt ?? comment.createdAt
  };
  const assistantMessages = currentMessages.filter((message) => message.role === "assistant");

  return {
    ...currentThread,
    id: resolveThreadId(currentThread?.id, comment.blockId),
    anchorId: comment.blockId,
    status: currentThread?.status ?? "open",
    title: comment.blockTitle,
    description: comment.blockDescription,
    messages: [userMessage, ...assistantMessages]
  };
}

function createArtifactCommentFromThread(thread: unknown): ArtifactStateComment[] {
  if (!isRecord(thread) || typeof thread.anchorId !== "string" || !Array.isArray(thread.messages)) {
    return [];
  }

  const typedThread = thread as ArtifactStateThread & { anchorId: string };
  const userMessage = thread.messages.find(isUserStateMessage);
  if (!userMessage) {
    return [];
  }

  return [
    {
      id: typeof userMessage.id === "string" ? userMessage.id : `comment-${typedThread.anchorId}`,
      blockId: typedThread.anchorId,
      blockTitle: typeof typedThread.title === "string" ? typedThread.title : typedThread.anchorId,
      blockDescription: typeof typedThread.description === "string" ? typedThread.description : undefined,
      comment: userMessage.body.trim(),
      createdAt: typeof userMessage.createdAt === "string" ? userMessage.createdAt : ""
    }
  ];
}

function normalizeThreads(value: unknown): ArtifactStateThread[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isArtifactStateThread);
}

function isArtifactStateThread(value: unknown): value is ArtifactStateThread {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.id === "string" && typeof value.anchorId === "string" && Array.isArray(value.messages);
}

function isUserStateMessage(value: unknown): value is ArtifactStateMessage & { body: string } {
  return isRecord(value) && value.role === "user" && typeof value.body === "string" && value.body.trim().length > 0;
}

function isArtifactStateMeta(value: unknown): value is ArtifactStateMeta {
  return (
    isRecord(value) &&
    typeof value.sourcePath === "string" &&
    typeof value.statePath === "string" &&
    typeof value.writable === "boolean"
  );
}

function resolveThreadId(currentId: string | undefined, anchorId: string) {
  if (currentId && currentId.length <= 32) {
    return currentId;
  }

  return `thr_${compactId(anchorId)}`;
}

function compactId(value: string) {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
