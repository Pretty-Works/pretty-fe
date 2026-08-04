"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import Chip from "@/components/Chip/Chip";
import FormField from "@/components/FormField/FormField";
import SuggestList from "@/components/SuggestList/SuggestList";

import { useClickOutside } from "@/hooks/useClickOutside";

import styles from "./PeoplePicker.module.css";

export interface PeopleOption {
  id: string;
  name: string;
  /** 소속·직급 등 이름 옆에 함께 보여줄 값 */
  description?: string;
}

interface PeoplePickerProps {
  label: string;
  /** 검색 대상 후보 */
  options: PeopleOption[];
  /** 선택된 사람의 id */
  value: string[];
  onChange: (ids: string[]) => void;
  /**
   * 항상 앞에 표시되는 고정 인원 (작성자 등).
   * value에 들어가지 않아 서버로 보낼 목록과 분리되고, 제거·재선택도 막힌다.
   */
  pinned?: PeopleOption[];
  required?: boolean;
  placeholder?: string;
  emptyText?: string;
  /** 입력창 오른쪽에 표시되는 보조 안내 (예: "Enter ↵") */
  hint?: React.ReactNode;
  /**
   * 검색어가 바뀔 때마다 호출. 서버에서 후보를 찾아 `options`에 실어 주는 용도다.
   * 넘기지 않으면 `options` 안에서만 찾는 기존 동작 그대로다.
   */
  onQueryChange?: (query: string) => void;
  /** 서버 검색 중 — "검색 결과가 없어요" 대신 진행 중임을 알린다 */
  searching?: boolean;
}

const labelOf = (person: PeopleOption) =>
  person.description ? `${person.name} · ${person.description}` : person.name;

// 이름을 검색해 목록에서 고르면 아래에 칩으로 쌓이는 인원 선택 필드.
// 회의록 작성 · 일정 모달 등에서 공통으로 쓴다.
export default function PeoplePicker({
  label,
  options,
  value,
  onChange,
  pinned = [],
  required = false,
  placeholder = "이름을 검색한 뒤 목록에서 선택하세요",
  emptyText = "검색 결과가 없어요",
  hint,
  onQueryChange,
  searching = false,
}: PeoplePickerProps) {
  const [query, setQuery] = useState("");

  // 검색어는 두 곳이 봐야 한다 — 목록을 거르는 이 컴포넌트와, 서버에 물어보는 부모.
  const changeQuery = useCallback(
    (next: string) => {
      setQuery(next);
      onQueryChange?.(next);
    },
    [onQueryChange],
  );

  const searchRef = useRef<HTMLDivElement>(null);
  const closeSuggest = useCallback(() => changeQuery(""), [changeQuery]);
  useClickOutside(searchRef, closeSuggest, query.trim().length > 0);

  // 서버 검색을 쓰면 후보 목록이 검색어마다 통째로 갈린다.
  // 고른 사람을 따로 기억해 두지 않으면 다음 글자를 치는 순간 칩이 사라진다.
  const [pickedById, setPickedById] = useState<Record<string, PeopleOption>>({});

  const pinnedIds = pinned.map((person) => person.id);

  // 이미 담긴 사람과 고정 인원은 목록에서 뺀다 (중복 추가 방지)
  const suggestions = options.filter(
    (option) =>
      labelOf(option).includes(query.trim()) &&
      !value.includes(option.id) &&
      !pinnedIds.includes(option.id),
  );

  const selected = useMemo(
    () =>
      value
        .map(
          (id) => pickedById[id] ?? options.find((option) => option.id === id),
        )
        .filter((option): option is PeopleOption => Boolean(option)),
    [value, options, pickedById],
  );

  const add = (name: string) => {
    const picked = suggestions.find((option) => labelOf(option) === name);

    if (picked && !value.includes(picked.id)) {
      setPickedById((current) => ({ ...current, [picked.id]: picked }));
      onChange([...value, picked.id]);
    }

    changeQuery("");
  };

  const remove = (id: string) => {
    onChange(value.filter((current) => current !== id));
  };

  // 결과 목록이 열려 있을 때 ESC는 목록만 닫는다.
  // 모달 안에서 쓰일 때 ESC가 모달까지 올라가 입력하던 내용째로 닫히는 걸 막는다.
  // Enter는 검색 결과 첫 번째 인원을 바로 추가한다.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && query.trim()) {
      e.stopPropagation();
      changeQuery("");
      return;
    }

    if (e.key === "Enter" && query.trim() && suggestions.length > 0) {
      e.preventDefault();
      add(labelOf(suggestions[0]));
    }
  };

  return (
    <div className={styles.field}>
      <div className={styles.search} ref={searchRef} onKeyDown={handleKeyDown}>
        <FormField
          label={label}
          required={required}
          placeholder={placeholder}
          value={query}
          onChange={(e) => changeQuery(e.target.value)}
          right={hint}
        />

        {query.trim() && (
          <SuggestList
            items={suggestions.map(labelOf)}
            onSelect={add}
            emptyText={searching ? "찾는 중이에요…" : emptyText}
          />
        )}
      </div>

      {(pinned.length > 0 || selected.length > 0) && (
        <div className={styles.chips}>
          {/* 고정 인원 — onRemove를 넘기지 않아 ✕ 없이 기본 톤으로 렌더된다 */}
          {pinned.map((person) => (
            <Chip key={person.id} label={labelOf(person)} />
          ))}

          {selected.map((person) => (
            <Chip
              key={person.id}
              label={labelOf(person)}
              tone="primary"
              onRemove={() => remove(person.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
