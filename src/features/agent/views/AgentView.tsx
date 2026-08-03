'use client';

import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

import { IoMenu, IoClose } from "react-icons/io5";
import { LuPlus } from "react-icons/lu";
import { FaExpand, FaCompress } from "react-icons/fa";

import { useAgentStore } from "@/stores/useAgentStore";

import AgentChatIcon from "@/assets/icons/agent/agent-chat.png";
import SendIcon from "@/assets/icons/agent/send.png";
import FileIcon from "@/assets/icons/agent/file.png";

import styles from "./AgentView.module.css";
import Button from "@/components/Button/Button";
import MessageBubble from "@/features/agent/components/MessageBubble/MessageBubble";
import AgentRunIndicator from "@/features/agent/components/AgentRunIndicator/AgentRunIndicator";
import ChoicePrompt from "@/features/agent/components/ChoicePrompt/ChoicePrompt";
import { useChat } from "@/features/agent/hooks/useChat";
import { RECOMMENDED_PROMPTS } from "@/features/agent/mock";
import { resolveRoute } from "@/features/agent/screenRegistry";

const HEADER_ICONS = [
  { id: "menu", Icon: IoMenu, alt: "agent-menu-icon" },
  { id: "plus", Icon: LuPlus, alt: "agent-plus-icon" },
  { id: "expand", Icon: FaExpand, alt: "agent-expand-icon" },
  { id: "close", Icon: IoClose, alt: "agent-close-icon" },
];

export default function AgentView() {
  const pathname = usePathname();
  const router = useRouter();

  const toggleFolded = useAgentStore((state) => state.toggleFolded);
  const toggleExpanded = useAgentStore((state) => state.toggleExpanded);
  const expanded = useAgentStore((state) => state.expanded);

  const {
    conversations,
    activeId,
    messages,
    runAgents,
    isBusy,
    pendingChoice,
    approvalAction,
    sendMessage,
    answerChoice,
    answerApproval,
    approve,
    reject,
    resolveApproval,
    selectConversation,
    startNewChat,
  } = useChat();

  const [message, setMessage] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 선택지 또는 승인 대기 중이면 입력 차단
  const isBlocked = pendingChoice !== null || approvalAction !== null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, runAgents, pendingChoice, approvalAction]);

  const handleSend = () => {
    if (isBlocked) return;
    if (!message.trim() && !attachedFile) return;

    sendMessage(message, attachedFile ? { name: attachedFile.name } : undefined);
    setMessage("");
    setAttachedFile(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = "24px";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedFile(file);
    e.target.value = "";
  };

  const handleRemoveFile = () => setAttachedFile(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const handleMenuClick = () => setIsMenuOpen((prev) => !prev);

  const handleSelectConversation = (id: string) => {
    selectConversation(id);
    setIsMenuOpen(false);
  };

  const handleIconClick = (id: string) => {
    switch (id) {
      case "menu":
        handleMenuClick();
        break;
      case "plus":
        startNewChat();
        setIsMenuOpen(false);
        break;
      case "expand":
        toggleExpanded();
        break;
      case "close":
        toggleFolded();
        break;
    }
  };

  const handleNavigate = () => {
    const route = resolveRoute(approvalAction?.targetScreen, approvalAction?.params);
    if (route) router.push(route);
    resolveApproval();
  };

  // 선택지 / 승인 → 하나의 선택 UI 로 통합
  const selection = pendingChoice
    ? {
        options: (pendingChoice.options ?? []).map((label) => ({
          label,
          onSelect: () => answerChoice(label),
        })),
        placeholder: pendingChoice.placeholder ?? "직접 입력",
        onDirect: answerChoice,
      }
    : approvalAction
      ? {
          options: [
            { label: "승인", onSelect: approve },
            { label: "거절", onSelect: reject },
            ...(approvalAction.targetScreen
              ? [{ label: "이동", onSelect: handleNavigate }]
              : []),
          ],
          placeholder: "직접 입력",
          onDirect: answerApproval,
        }
      : null;

  const isEmpty = messages.length === 0 && !isBusy;
  const isHome = pathname === "/";

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
          {HEADER_ICONS.map((icon) => {
            const Icon =
              icon.id === "expand"
                ? expanded
                  ? FaCompress
                  : FaExpand
                : icon.Icon;
            const isActive =
              (icon.id === "menu" && isMenuOpen) ||
              (icon.id === "expand" && expanded);

            return (
              <button
                key={icon.id}
                type="button"
                aria-label={icon.alt}
                className={[styles.headerIcon, isActive && styles.headerIconActive]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => handleIconClick(icon.id)}
              >
                <Icon size={icon.id === "expand" ? 16 : 20} />
              </button>
            );
          })}
        </div>
      </header>

      {/* 최근 대화 */}
      {isMenuOpen && (
        <div className={styles.menuList}>
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              className={[
                styles.menuItem,
                conversation.id === activeId && styles.menuItemActive,
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => handleSelectConversation(conversation.id)}
            >
              <span className={styles.menuTitle}>{conversation.title}</span>
              {conversation.pending && (
                <span className={styles.pendingBadge}>pending</span>
              )}
            </button>
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
              {isHome
                ? "아래 추천으로 빠르게 시작해 보세요"
                : "회의·업무·휴가·결재·예약을 도와드려요"}
            </div>

            {isHome && (
              <div className={styles.recommendList}>
                {RECOMMENDED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className={styles.recommendItem}
                    onClick={() => sendMessage(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.chatContent}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* 실행 중 에이전트 */}
            {isBusy && runAgents && <AgentRunIndicator agents={runAgents} />}

            {/* 선택 UI */}
            {selection && !isBusy && (
              <ChoicePrompt
                options={selection.options}
                placeholder={selection.placeholder}
                onDirect={selection.onDirect}
              />
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </main>

      {/* 입력창 */}
      <footer className={styles.inputArea}>
        {attachedFile && (
          <div className={styles.attachment}>
            <div className={styles.attachmentIcon}>
              <Image src={FileIcon} alt="file-icon" width={13} height={13} />
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

        <div
          className={[styles.inputWrapper, isBlocked && styles.inputWrapperBlocked]
            .filter(Boolean)
            .join(" ")}
        >
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => fileInputRef.current?.click()}
            disabled={isBlocked}
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
            placeholder={
              isBlocked ? "먼저 위에서 선택해 주세요" : "메시지를 입력하세요"
            }
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isBlocked}
          />

          <Button
            status="agent"
            onClick={handleSend}
            disabled={isBlocked}
            icon={<Image src={SendIcon} alt="send" width={18} height={18} />}
          />
        </div>
      </footer>
    </div>
  );
}
