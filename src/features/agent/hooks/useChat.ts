"use client";

import { useState } from "react";

import { type ChatAttachment, type ChatMessage } from "@/features/agent/types";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAgentTyping, setIsAgentTyping] = useState(false);

  const sendMessage = (text: string, attachment?: ChatAttachment) => {
    const trimmed = text.trim();
    if (!trimmed && !attachment) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
      attachment,
    };
    setMessages((prev) => [...prev, userMessage]);

    setIsAgentTyping(true);
    setTimeout(() => {
      const agentMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "agent",
        content: trimmed
          ? `"${trimmed}" 요청을 확인했어요.`
          : "첨부한 파일을 확인했어요.",
        createdAt: new Date().toISOString(),
      };
      setIsAgentTyping(false);
      setMessages((prev) => [...prev, agentMessage]);
    }, 900);
  };

  return { messages, isAgentTyping, sendMessage };
}
