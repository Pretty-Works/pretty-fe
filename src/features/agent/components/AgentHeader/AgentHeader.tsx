"use client";

import Image from "next/image";

import { IoMenu, IoClose } from "react-icons/io5";
import { LuPlus } from "react-icons/lu";
import { FaExpand, FaCompress } from "react-icons/fa";

import AgentChatIcon from "@/assets/icons/agent/agent-chat.png";

import styles from "./AgentHeader.module.css";

interface AgentHeaderProps {
  /** 최근 대화 목록이 펼쳐져 있는지 */
  menuOpen: boolean;
  /** 패널이 전체 화면으로 넓혀져 있는지 */
  expanded: boolean;
  onToggleMenu: () => void;
  onNewChat: () => void;
  onToggleExpanded: () => void;
  onClose: () => void;
}

function IconButton({
  label,
  active = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active || undefined}
      className={[styles.icon, active && styles.iconActive]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// 에이전트 패널 상단 — 제목과 패널 조작 버튼만 담당한다 (대화 내용은 모른다)
export default function AgentHeader({
  menuOpen,
  expanded,
  onToggleMenu,
  onNewChat,
  onToggleExpanded,
  onClose,
}: AgentHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {/* 옆의 "에이전트" 글자가 같은 뜻이라 스크린리더에는 읽히지 않게 둔다 */}
        <Image className={styles.logo} src={AgentChatIcon} alt="" />
        <div className={styles.title}>에이전트</div>
      </div>

      <div className={styles.right}>
        <IconButton label="최근 대화" active={menuOpen} onClick={onToggleMenu}>
          <IoMenu size={20} />
        </IconButton>

        <IconButton label="새 대화" onClick={onNewChat}>
          <LuPlus size={20} />
        </IconButton>

        <IconButton
          label={expanded ? "패널 좁히기" : "패널 넓히기"}
          active={expanded}
          onClick={onToggleExpanded}
        >
          {expanded ? <FaCompress size={16} /> : <FaExpand size={16} />}
        </IconButton>

        <IconButton label="에이전트 닫기" onClick={onClose}>
          <IoClose size={20} />
        </IconButton>
      </div>
    </header>
  );
}
