"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useLocalStorage } from "./use-local-storage";

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  sources?: KnowledgeSource[];
}

export interface KnowledgeSource {
  id: string;
  title: string;
  contributor: string;
}

async function readSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (accumulated: string) => void,
  onSources?: (sources: KnowledgeSource[]) => void,
): Promise<string> {
  const decoder = new TextDecoder();
  let accumulated = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    const text = decoder.decode(value, { stream: true });
    const lines = text.split("\n");

    for (const line of lines) {
      if (!line.startsWith("data: ")) {
        continue;
      }
      const data = line.slice(6);
      if (data === "[DONE]") {
        return accumulated;
      }
      try {
        const parsed = JSON.parse(data) as {
          content?: string;
          type?: string;
          message?: string;
          sources?: KnowledgeSource[];
        };
        if (parsed.type === "sources" && onSources) {
          onSources(parsed.sources as KnowledgeSource[]);
          continue;
        }
        if (parsed.type === "error") {
          toast.error(parsed.message ?? "Response may not have been saved");
          continue;
        }
        if (parsed.type === "done") {
          continue;
        }
        if (parsed.content) {
          accumulated += parsed.content;
          onChunk(accumulated);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }

  return accumulated;
}

function makeTempMessage(conversationId: string, role: string, content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}`,
    conversationId,
    role,
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function useChat() {
  const {
    items: conversations,
    addItem,
    removeItem,
    updateItem,
  } = useLocalStorage("chat-conversations");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const skipNextFetchRef = useRef(false);
  const knowledgeSourcesRef = useRef<KnowledgeSource[]>([]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const res = await fetch(`/api/chat/conversations/${activeConversationId}/messages`);
        if (res.ok) {
          const data = (await res.json()) as { messages: ChatMessage[] };
          setMessages(data.messages);
        }
      } catch {
        toast.error("Failed to load messages");
      } finally {
        setIsLoadingMessages(false);
      }
    };

    void fetchMessages();
  }, [activeConversationId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (isStreaming || !content.trim()) {
        return;
      }

      setIsStreaming(true);
      setStreamingContent("");
      setKnowledgeSources([]);
      knowledgeSourcesRef.current = [];

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const tempUserMessage = makeTempMessage(activeConversationId ?? "", "user", content);
      setMessages((prev) => [...prev, tempUserMessage]);

      try {
        const res = await fetch("/api/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            conversationId: activeConversationId ?? undefined,
          }),
          signal: abortController.signal,
        });

        if (!res.ok) {
          throw new Error("Failed to send message");
        }

        const conversationId = res.headers.get("X-Conversation-Id");

        if (!activeConversationId && conversationId) {
          skipNextFetchRef.current = true;
          setActiveConversationId(conversationId);
          const title = content.length > 50 ? `${content.substring(0, 50)}...` : content;
          addItem({ id: conversationId, title, updatedAt: new Date().toISOString() });
          setMessages((prev) =>
            prev.map((m) => (m.id === tempUserMessage.id ? { ...m, conversationId } : m)),
          );
        } else if (activeConversationId) {
          updateItem(activeConversationId, { updatedAt: new Date().toISOString() });
        }

        const reader = res.body?.getReader();
        if (!reader) {
          throw new Error("No reader");
        }

        const accumulated = await readSSEStream(reader, setStreamingContent, (sources) => {
          knowledgeSourcesRef.current = sources;
          setKnowledgeSources(sources);
        });

        if (accumulated) {
          const base = makeTempMessage(
            conversationId ?? activeConversationId ?? "",
            "assistant",
            accumulated,
          );
          const assistantMessage: ChatMessage =
            knowledgeSourcesRef.current.length > 0
              ? { ...base, sources: knowledgeSourcesRef.current }
              : base;
          setMessages((prev) => [...prev, assistantMessage]);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          // Intentional abort — no toast needed
        } else {
          toast.error("Failed to send message");
        }
      } finally {
        abortControllerRef.current = null;
        setIsStreaming(false);
        setStreamingContent("");
      }
    },
    [activeConversationId, isStreaming, addItem, updateItem],
  );

  const selectConversation = useCallback((id: string) => {
    abortControllerRef.current?.abort();
    setActiveConversationId(id);
    setStreamingContent("");
  }, []);

  const createNewChat = useCallback(() => {
    abortControllerRef.current?.abort();
    setActiveConversationId(null);
    setMessages([]);
    setStreamingContent("");
  }, []);

  const renameConversation = useCallback(
    async (id: string, title: string) => {
      try {
        const res = await fetch(`/api/chat/conversations/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
        if (res.ok) {
          updateItem(id, { title });
        }
      } catch {
        toast.error("Failed to rename conversation");
      }
    },
    [updateItem],
  );

  const deleteConversation = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/chat/conversations/${id}`, { method: "DELETE" });
        removeItem(id);
        if (activeConversationId === id) {
          setActiveConversationId(null);
          setMessages([]);
        }
      } catch {
        toast.error("Failed to delete conversation");
      }
    },
    [activeConversationId, removeItem],
  );

  return {
    conversations,
    activeConversationId,
    messages,
    isStreaming,
    isLoadingMessages,
    streamingContent,
    knowledgeSources,
    sendMessage,
    selectConversation,
    createNewChat,
    renameConversation,
    deleteConversation,
  };
}
