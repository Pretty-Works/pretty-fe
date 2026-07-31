"use client";

import styles from "./SuggestList.module.css";

interface SuggestListProps {
  items: string[];
  onSelect: (item: string) => void;
  emptyText?: string;
}

// 입력창 바로 아래로 펼쳐지는 자동완성 목록.
// 부모가 position: relative 컨테이너와 열림 여부를 맡는다.
export default function SuggestList({
  items,
  onSelect,
  emptyText = "검색 결과가 없어요",
}: SuggestListProps) {
  return (
    <ul className={styles.suggest}>
      {items.length > 0 ? (
        items.map((item) => (
          <li key={item}>
            <button
              type="button"
              className={styles.item}
              onClick={() => onSelect(item)}
            >
              {item}
            </button>
          </li>
        ))
      ) : (
        <li className={styles.empty}>{emptyText}</li>
      )}
    </ul>
  );
}
