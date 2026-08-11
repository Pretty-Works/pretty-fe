"use client";

import Image from "next/image";

import type { IconType } from "react-icons";
import {
  LuAlarmClock,
  LuCalendarClock,
  LuClock3,
  LuFolderCheck,
  LuListChecks,
  LuSparkles,
  LuTreePalm,
} from "react-icons/lu";

import AgentChatIcon from "@/assets/icons/agent/agent-chat.png";

import type { AgentSuggestion } from "@/features/agent/types";

import styles from "./EmptyChat.module.css";

/**
 * 추천 종류별 아이콘. 서버가 kind 를 늘려도 화면은 기본 아이콘으로 넘어간다 —
 * 여기 없는 값이 와도 칩은 그대로 걸린다.
 */
const KIND_ICONS: Record<string, IconType> = {
  overdue_task: LuAlarmClock,
  meeting_followup: LuListChecks,
  due_soon: LuClock3,
  upcoming_meeting: LuCalendarClock,
  project_check: LuFolderCheck,
  leave: LuTreePalm,
};

/**
 * 기다리는 동안 깔아 두는 자리 수.
 *
 * 서버는 0~3개를 주고 몇 개가 올지는 받아 봐야 안다. 셋을 깔면 둘이 왔을 때 한 줄이 줄지만,
 * 하나만 깔면 올 때마다 늘어나 첫 화면이 출렁인다.
 */
const SKELETON_COUNT = 3;

interface EmptyChatProps {
  /** 서버가 지금 상황에서 만들어 준 추천. 비어 있으면 추천 자리를 접는다 */
  suggestions: AgentSuggestion[];
  /** 추천을 받아오는 중 (서버에서 LLM 이 돌아 수 초가 걸린다) */
  loading: boolean;
  onSelectPrompt: (prompt: string) => void;
}

// 아직 주고받은 메시지가 없을 때의 첫 화면
export default function EmptyChat({
  suggestions,
  loading,
  onSelectPrompt,
}: EmptyChatProps) {
  const hasSuggestions = suggestions.length > 0;

  return (
    <div className={styles.empty}>
      <Image className={styles.icon} src={AgentChatIcon} alt="" />
      <div className={styles.title}>무엇을 도와드릴까요?</div>
      <div className={styles.description}>
        {loading
          ? "지금 챙길 것을 찾고 있어요"
          : hasSuggestions
            ? "아래 추천으로 빠르게 시작해 보세요"
            : "회의·업무·휴가·결재·예약을 도와드려요"}
      </div>

      {/* 기다리는 자리. 문구는 위 description 이 이미 말하고 있어 읽어 줄 것이 없다 */}
      {loading && (
        <div className={styles.list} aria-hidden>
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <div key={index} className={styles.skeleton} />
          ))}
        </div>
      )}

      {hasSuggestions && (
        <div className={styles.list}>
          {suggestions.map((suggestion) => {
            const Icon = KIND_ICONS[suggestion.kind ?? ""] ?? LuSparkles;

            return (
              <button
                key={suggestion.prompt}
                type="button"
                className={styles.item}
                /* 보내는 것은 text 가 아니라 prompt 다 — text 는 물음형이라 에이전트가 되묻는다 */
                onClick={() => onSelectPrompt(suggestion.prompt)}
              >
                <Icon className={styles.itemIcon} aria-hidden />
                {suggestion.text}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
