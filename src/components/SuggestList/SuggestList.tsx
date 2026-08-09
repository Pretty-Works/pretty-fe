"use client";

import styles from "./SuggestList.module.css";

export interface SuggestItem {
  /** 고른 값을 되찾는 열쇠. 동명이인이 있어도 서로 섞이지 않는다 */
  id: string;
  label: string;
}

interface SuggestListProps {
  items: SuggestItem[];
  onSelect: (id: string) => void;
  emptyText?: string;
}

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
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
