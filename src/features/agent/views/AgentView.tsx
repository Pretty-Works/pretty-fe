'use client';

import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import { usePathname } from "next/navigation";

import { useAgentStore } from "@/stores/useAgentStore";

import AgentChatIcon from "@/assets/icons/agent/agent-chat.png";
import SendIcon from "@/assets/icons/agent/send.png";
import MenuIcon from "@/assets/icons/agent/menu.png";
import PlusIcon from "@/assets/icons/agent/plus.png";
import CloseIcon from "@/assets/icons/agent/close.png";
import FileIcon from "@/assets/icons/agent/file.png";

import styles from "./page.module.css";
import Button from "@/components/button/Button";
import MessageBubble, {
  TypingBubble,
} from "@/features/agent/components/MessageBubble";
import { useChat } from "@/features/agent/hooks/useChat";

const HEADER_ICONS = [
  { id: "menu", src: MenuIcon, alt: "agent-menu-icon" },
  { id: "plus", src: PlusIcon, alt: "agent-plus-icon" },
  { id: "close", src: CloseIcon, alt: "agent-close-icon" },
];

export default function AgentView() {
  const pathname = usePathname();

  const toggleFolded = useAgentStore((state) => state.toggleFolded);

  const { messages, isAgentTyping, sendMessage } = useChat();

  const [message, setMessage] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const conversations = [
    { title: "1번 대화 기록" },
    { title: "2번 대화 기록" },
    { title: "3번 대화 기록" },
    { title: "4번 대화 기록" },
    { title: "5번 대화 기록" },
    { title: "6번 대화 기록" },
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAgentTyping]);

  const handleSend = () => {
    if (!message.trim() && !attachedFile) return;

    sendMessage(message, attachedFile ? { name: attachedFile.name } : undefined);
    setMessage("");
    setAttachedFile(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = "24px";
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachedFile(file);

    e.target.value = "";
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
  };

  const handleInput = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setMessage(e.target.value);

    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const handleMenuClick = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleIconClick = (id: string, index: number) => {
    setActiveIndex(index);

    switch (id) {
      case "menu":
        handleMenuClick();
        break;
      case "plus":
        break;
      case "close":
        toggleFolded();
        break;
    }
  };

  const isEmpty = messages.length === 0 && !isAgentTyping;

  return (
    <div className={styles.agent}>
      {/* 헤더 */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Image
            className={styles.headerLogo}
            src={AgentChatIcon}
            alt="agent-chat-icon"
          />
          <div className={styles.title}>에이전트</div>
        </div>

        <div className={styles.headerRight}>
          {HEADER_ICONS.map((icon, index) => (
            <button
              key={icon.alt}
              type="button"
              className={[
                styles.headerIcon,
                index === activeIndex && styles.headerIconActive,
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => handleIconClick(icon.id, index)}
            >
              <Image src={icon.src} alt={icon.alt} width={30} height={30} />
            </button>
          ))}
        </div>
      </header>

      {/* 최근 대화 */}
      {isMenuOpen && (
        <div className={styles.menuList}>
          {conversations.map((conversation) => (
            <div key={conversation.title} className={styles.menuItem}>
              {conversation.title}
            </div>
          ))}
        </div>
      )}

      {/* 채팅창 */}
      <main className={styles.chat}>
        {isEmpty ? (
          <div className={styles.empty}>
            <Image
              className={styles.emptyIcon}
              src={AgentChatIcon}
              alt="agent-chat-icon"
            />
            <div className={styles.emptyTitle}>무엇을 도와드릴까요?</div>
            <div className={styles.emptyDescription}>
              회의·업무·휴가·결재·예약을 도와드려요
            </div>
          </div>
        ) : (
          <div className={styles.chatContent}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isAgentTyping && <TypingBubble />}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      {/* 입력창 */}
      <footer className={styles.inputArea}>
        {attachedFile && (
          <div className={styles.attachment}>
            <div className={styles.attachmentIcon}>
              <Image
                src={FileIcon}
                alt="file-icon"
                width={13}
                height={13}
              />
            </div>
            <span className={styles.attachmentName}>{attachedFile.name}</span>
            <button
              type="button"
              className={styles.attachmentRemove}
              onClick={handleRemoveFile}
              aria-label="첨부 파일 삭제"
            >
              ✕
            </button>
          </div>
        )}

        <div className={styles.inputWrapper}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => fileInputRef.current?.click()}
          >
            📎
          </button>

          <input
            ref={fileInputRef}
            hidden
            type="file"
            onChange={handleFileSelect}
          />

          <textarea
            ref={textareaRef}
            className={styles.input}
            placeholder="메시지를 입력하세요"
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
          />

          <Button
            status="agent"
            onClick={handleSend}
            icon={
              <Image
                src={SendIcon}
                alt="send"
                width={18}
                height={18}
              />
            }
          />
        </div>
      </footer>
    </div>
  );
}
