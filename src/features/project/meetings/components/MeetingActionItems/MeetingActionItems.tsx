"use client";

import { useEffect, useRef, useState } from "react";

import { formatDateLabel } from "@/lib/date";

import Badge from "@/components/Badge/Badge";
import Button from "@/components/Button/Button";

import ProjectTable, {
  type ProjectTableColumn,
} from "@/features/project/components/ProjectTable/ProjectTable";
import { ACTION_ITEM_BADGE } from "@/features/project/meetings/constants/actionItems";
import type { MeetingActionItem } from "@/features/project/meetings/types";

import styles from "./MeetingActionItems.module.css";

interface MeetingActionItemsProps {
  items: MeetingActionItem[];
  /** 줄마다 할 일을 만들 수 있을 때. 없으면 추가 칸을 감춘다 */
  onAddTask?: (item: MeetingActionItem) => void;
}

// 에이전트가 회의록을 훑는 시간. 누르자마자 표가 나오면 아무 일도 없던 것처럼 보인다
const GENERATE_MS = 900;

// 좁아지면 완료 목표일부터 접는다 — 담당자·상태와 달리 표에서 훑는 값이 아니다
const BASE_COLUMNS: ProjectTableColumn<MeetingActionItem>[] = [
  { key: "task", header: "실행 항목", tone: "title" },
  { key: "owner", header: "담당자", width: 110, tone: "sub" },
  {
    key: "due",
    header: "완료 목표일",
    width: 150,
    tone: "sub",
    fold: "compact",
    render: (item) => <span>{formatDateLabel(item.due)}</span>,
  },
  {
    key: "status",
    header: "상태",
    width: 84,
    render: (item) => (
      <Badge type={ACTION_ITEM_BADGE[item.status]} badgeStyle="weak">
        {item.status}
      </Badge>
    ),
  },
];

// 회의록 실행 항목 — 에이전트가 뽑아낸 뒤에야 표가 열린다
export default function MeetingActionItems({
  items,
  onAddTask,
}: MeetingActionItemsProps) {
  const [phase, setPhase] = useState<"idle" | "generating" | "done">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 표가 열리기 전에 화면을 떠나면 타이머만 남는다
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // 뽑아낼 게 없으면 섹션째 그리지 않는다 — 눌러도 열릴 표가 없다
  if (items.length === 0) return null;

  const generate = () => {
    if (phase === "generating") return;

    setPhase("generating");
    timer.current = setTimeout(() => setPhase("done"), GENERATE_MS);
  };

  const done = phase === "done";

  // 할 일을 만들 수 없는 화면에서는 마지막 칸을 통째로 뺀다
  const columns: ProjectTableColumn<MeetingActionItem>[] = onAddTask
    ? [
        ...BASE_COLUMNS,
        {
          key: "add",
          header: "",
          width: 96,
          render: (item) => (
            <button
              type="button"
              className={styles.addTask}
              onClick={() => onAddTask(item)}
            >
              + 할 일 추가
            </button>
          ),
        },
      ]
    : BASE_COLUMNS;

  return (
    <section className={styles.card} aria-label="실행 항목">
      <div className={styles.cardHead}>
        <h3 className={styles.cardTitle}>실행 항목</h3>
        {done && (
          <Badge type="elephant" badgeStyle="weak">
            {items.length}
          </Badge>
        )}
      </div>

      <div className={styles.aiBox}>
        <div className={styles.aiText}>
          {/* 다 뽑고 나면 문구가 바뀌는 것으로 끝난 걸 알린다 */}
          <span className={styles.aiTitle} aria-live="polite">
            <span className={styles.star} aria-hidden="true">
              ✦
            </span>{" "}
            {done
              ? `이 회의록에서 실행 항목 ${items.length}건을 찾았어요`
              : phase === "generating"
                ? "회의록에서 실행 항목을 뽑고 있어요"
                : "회의록에서 실행 항목을 뽑아 드릴게요"}
          </span>
          <span className={styles.aiDesc}>
            {done
              ? "담당자·완료 목표일을 반영해 각 담당자의 할 일로 등록하고 알림을 보냈어요."
              : "에이전트가 담당자·완료 목표일을 반영해 각 담당자의 할 일로 등록하고 알림을 보냅니다."}
          </span>
        </div>

        <Button
          size="medium"
          type={done ? "light" : "primary"}
          buttonStyle={done ? "weak" : "fill"}
          loading={phase === "generating"}
          onClick={generate}
        >
          {done ? "다시 생성" : "에이전트로 할 일 생성"}
        </Button>
      </div>

      {/* 버튼을 누르기 전에는 표를 열지 않는다 */}
      {done && (
        <ProjectTable
          columns={columns}
          rows={items}
          rowKey={(item) => item.id}
        />
      )}
    </section>
  );
}
