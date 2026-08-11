"use client";

import { cx } from "@/lib/cx";

import styles from "./SuggestList.module.css";

/** 이름 오른쪽에 붙는 짧은 표식 — 역할(강조) · 휴직(회색) · 책임자(테두리) */
export interface SuggestBadge {
  text: string;
  tone?: "primary" | "muted" | "outline";
}

export interface SuggestItem {
  /** 고른 값을 되찾는 열쇠. 동명이인이 있어도 서로 섞이지 않는다 */
  id: string;
  label: string;
  /** 이름 옆 회색 보조 문구 (부서·직급 등). 없으면 한 줄짜리 항목 그대로다 */
  meta?: string;
  badges?: SuggestBadge[];
}

interface SuggestListProps {
  items: SuggestItem[];
  onSelect: (id: string) => void;
  emptyText?: string;
}

const BADGE_CLASS: Record<NonNullable<SuggestBadge["tone"]>, string> = {
  primary: styles.badgePrimary,
  muted: styles.badgeMuted,
  outline: styles.badgeOutline,
};

// 입력창 바로 아래로 펼쳐지는 자동완성 목록.
// 부모가 position: relative 컨테이너와 열림 여부를 맡는다.
export default function SuggestList({
  items,
  onSelect,
  emptyText = "검색 결과가 없어요",
}: SuggestListProps) {
  if (items.length === 0) {
    return (
      <ul className={styles.suggest}>
        <li className={styles.empty}>{emptyText}</li>
      </ul>
    );
  }

  return (
    <ul className={styles.suggest}>
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            className={styles.item}
            onClick={() => onSelect(item.id)}
          >
            <span className={styles.label}>{item.label}</span>

            {/* 보조 문구가 남는 자리를 다 먹어 표식은 항상 오른쪽 끝에 선다 */}
            {item.meta && <span className={styles.meta}>{item.meta}</span>}

            {item.badges?.map((badge) => (
              <span
                key={badge.text}
                className={cx(
                  styles.badge,
                  BADGE_CLASS[badge.tone ?? "primary"],
                )}
              >
                {badge.text}
              </span>
            ))}
          </button>
        </li>
      ))}
    </ul>
  );
}
