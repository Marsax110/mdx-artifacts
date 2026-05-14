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

export type ArtifactStateReviewThread = {
  id: string;
  blockId: string;
  blockTitle: string;
  blockDescription?: string;
  status: string;
  messages: ArtifactStateMessage[];
};

export type ArtifactStateStatus = "loading" | "static" | "ready" | "saving" | "saved" | "error";

type ArtifactStateContextValue = {
  state?: ArtifactStateValue;
  actions: {
    saveComments: (comments: ArtifactStateComment[]) => Promise<void>;
    saveThreads: (threads: ArtifactStateReviewThread[]) => Promise<void>;
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

  useEffect(() => {
    if (!daemonMeta || typeof window === "undefined" || typeof fetch !== "function") {
      return;
    }

    const interval = window.setInterval(async () => {
      if (status === "saving") {
        return;
      }

      try {
        const response = await fetch("/__artifact/state", { headers: { accept: "application/json" } });
        if (!response.ok) {
          return;
        }

        const nextState = normalizeArtifactState(await response.json(), daemonMeta.sourcePath);
        setState((current) => (sameArtifactState(current, nextState) ? current : nextState));
      } catch {
        // Keep the current in-page state when the local daemon is temporarily unavailable.
      }
    }, 2000);

    return () => window.clearInterval(interval);
  }, [daemonMeta, status]);

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
        async saveThreads(threads) {
          if (!daemonMeta) {
            return;
          }

          const nextState = createArtifactStateFromThreads(threads, state, daemonMeta.sourcePath);
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
  return createArtifactStateFromThreads(comments.map(createReviewThreadFromComment), currentState, sourcePath);
}

export function createArtifactStateFromThreads(
  threads: ArtifactStateReviewThread[],
  currentState: unknown,
  sourcePath: string
): ArtifactStateValue {
  const baseState = normalizeArtifactState(currentState, sourcePath);
  const reviewThreads = threads.map((thread) => createStateThreadFromReviewThread(thread, baseState.threads));
  const threadAnchorIds = new Set(reviewThreads.map((thread) => thread.anchorId));
  const retainedThreads = baseState.threads.filter((thread) => !threadAnchorIds.has(thread.anchorId));

  return {
    ...baseState,
    source: sourcePath,
    threads: [...retainedThreads, ...reviewThreads]
  };
}

export function createArtifactCommentsFromState(value: unknown): ArtifactStateComment[] {
  return createArtifactThreadsFromState(value).flatMap((thread) => {
    const userMessage = thread.messages.find((message) => message.role === "user" && message.body.trim().length > 0);
    if (!userMessage) {
      return [];
    }

    return [
      {
        id: userMessage.id,
        blockId: thread.blockId,
        blockTitle: thread.blockTitle,
        blockDescription: thread.blockDescription,
        comment: userMessage.body.trim(),
        createdAt: userMessage.createdAt ?? ""
      }
    ];
  });
}

export function createArtifactThreadsFromState(value: unknown): ArtifactStateReviewThread[] {
  if (!isRecord(value) || !Array.isArray(value.threads)) {
    return [];
  }

  return value.threads.flatMap((thread) => createArtifactThreadFromStateThread(thread));
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

function sameArtifactState(first: ArtifactStateValue | undefined, second: ArtifactStateValue) {
  return JSON.stringify(first) === JSON.stringify(second);
}

function createEmptyArtifactState(sourcePath: string): ArtifactStateValue {
  return {
    version: 1,
    source: sourcePath,
    threads: [],
    interactions: {}
  };
}

function createReviewThreadFromComment(comment: ArtifactStateComment): ArtifactStateReviewThread {
  return {
    id: `thread-${comment.id}`,
    blockId: comment.blockId,
    blockTitle: comment.blockTitle,
    blockDescription: comment.blockDescription,
    status: "open",
    messages: [
      {
        id: comment.id,
        role: "user",
        body: comment.comment,
        createdAt: comment.createdAt
      }
    ]
  };
}

function createStateThreadFromReviewThread(
  thread: ArtifactStateReviewThread,
  currentThreads: ArtifactStateThread[]
): ArtifactStateThread {
  const currentThread = currentThreads.find((item) => item.anchorId === thread.blockId);
  const currentMessages = currentThread?.messages ?? [];
  const messages = thread.messages.map((message) => {
    const currentMessage =
      currentMessages.find((item) => item.id === message.id) ??
      (message.role === "user" ? currentMessages.find((item) => item.role === "user") : undefined);
    return {
      ...currentMessage,
      id: currentMessage?.id ?? message.id,
      role: message.role,
      body: message.body,
      createdAt: currentMessage?.createdAt ?? message.createdAt
    };
  });
  const messageIds = new Set(messages.map((message) => message.id));
  const retainedAssistantMessages = currentMessages.filter(
    (message) => message.role === "assistant" && !messageIds.has(message.id)
  );

  return {
    ...currentThread,
    id: resolveThreadId(currentThread?.id, thread.blockId),
    anchorId: thread.blockId,
    status: thread.status,
    title: thread.blockTitle,
    description: thread.blockDescription,
    messages: [...messages, ...retainedAssistantMessages]
  };
}

function createArtifactThreadFromStateThread(thread: unknown): ArtifactStateReviewThread[] {
  if (!isRecord(thread) || typeof thread.anchorId !== "string" || !Array.isArray(thread.messages)) {
    return [];
  }

  const typedThread = thread as ArtifactStateThread & { anchorId: string };
  const messages = thread.messages.filter(isStateMessage);
  if (messages.length === 0) {
    return [];
  }

  return [
    {
      id: typedThread.id,
      blockId: typedThread.anchorId,
      blockTitle: typeof typedThread.title === "string" ? typedThread.title : typedThread.anchorId,
      blockDescription: typeof typedThread.description === "string" ? typedThread.description : undefined,
      status: typeof typedThread.status === "string" ? typedThread.status : "open",
      messages
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

function isStateMessage(value: unknown): value is ArtifactStateMessage {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    (value.role === "user" || value.role === "assistant") &&
    typeof value.body === "string" &&
    value.body.trim().length > 0
  );
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
  if (currentId && currentId.startsWith("thr") && currentId.length <= 32) {
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
