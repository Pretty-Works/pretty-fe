"use client";

import { formatDateLabel } from "@/lib/date";
import { cx } from "@/lib/cx";

import Badge from "@/components/Badge/Badge";
import Button from "@/components/Button/Button";

import ProjectTable, {
  type ProjectTableColumn,
} from "@/features/project/components/ProjectTable/ProjectTable";
import type { ActionItemAddState } from "@/features/project/meetings/hooks/useMeetingActionItems";
import type { MeetingActionItem } from "@/features/project/meetings/types";

import styles from "./MeetingActionItems.module.css";

interface MeetingActionItemsProps {
  items: MeetingActionItem[];
  /** 한 번이라도 뽑아낸 적이 있는가. 표를 열지 말지를 정한다 */
  generated: boolean;
  generating: boolean;
  onGenerate: () => void;
  /** 줄마다의 등록 상태 */
  addStateOf: (item: MeetingActionItem) => ActionItemAddState;
  /** 줄마다 할 일을 만들 수 있을 때. 없으면 등록 칸을 감춘다 */
  onAddTask?: (item: MeetingActionItem) => void;
}

// 값이 없는 칸. 에이전트는 회의록에 근거가 없으면 채우지 않는다 — 빈칸으로 두면 표가 깨져 보인다
const UNSET = "미정";

// 좁아지면 완료 목표일부터 접는다 — 담당자와 달리 표에서 훑는 값이 아니다
const BASE_COLUMNS: ProjectTableColumn<MeetingActionItem>[] = [
  { key: "action", header: "실행 항목", tone: "title" },
  {
    key: "assigneeName",
    header: "담당자",
    width: 110,
    tone: "sub",
    render: (item) =>
      item.assigneeName ? (
        <span className={styles.clip}>{item.assigneeName}</span>
      ) : (
        <span className={styles.unset}>{UNSET}</span>
      ),
  },
  {
    key: "dueDate",
    header: "완료 목표일",
    width: 150,
    tone: "sub",
    fold: "compact",
    render: (item) =>
      item.dueDate ? (
        <span>{formatDateLabel(item.dueDate)}</span>
      ) : (
        <span className={styles.unset}>{UNSET}</span>
      ),
  },
];

// 회의록 실행 항목 — 에이전트가 뽑아낸 뒤에야 표가 열린다.
// 뽑아낸 결과와 등록 이력은 회의록 단위로 남아, 목록에 갔다 돌아와도 이 화면이 그대로다.
export default function MeetingActionItems({
  items,
  generated,
  generating,
  onGenerate,
  addStateOf,
  onAddTask,
}: MeetingActionItemsProps) {
  // 할 일을 만들 수 없는 화면에서는 마지막 칸을 통째로 뺀다
  const columns: ProjectTableColumn<MeetingActionItem>[] = onAddTask
    ? [
        ...BASE_COLUMNS,
        {
          key: "add",
          header: "",
          width: 132,
          render: (item) => {
            const state = addStateOf(item);

            // 등록한 줄은 버튼을 없애지 않고 문구만 바꾼다 — 칸이 사라지면 표가 흔들리고,
            // 무엇을 이미 등록했는지 줄에서 바로 읽을 수 없다
            if (state.added) {
              return (
                <span className={styles.added} aria-live="polite">
                  ✓ 등록 완료
                </span>
              );
            }

            return (
              <button
                type="button"
                className={cx(styles.addTask, state.pending && styles.addTaskOff)}
                disabled={state.pending}
                // 빠진 값이 있으면 눌렀을 때 바로 등록되지 않고 팝업이 열린다.
                // 무엇을 채워야 하는지 미리 알려 둔다
                title={state.needsInput}
                aria-haspopup={state.needsInput ? "dialog" : undefined}
                onClick={() => onAddTask(item)}
              >
                {state.pending ? "등록 중…" : "+ 할 일 추가"}
              </button>
            );
          },
        },
      ]
    : BASE_COLUMNS;

  return (
    <section className={styles.card} aria-label="실행 항목">
      <div className={styles.cardHead}>
        <h3 className={styles.cardTitle}>실행 항목</h3>
        {generated && items.length > 0 && (
          <Badge type="elephant" badgeStyle="weak">
            {items.length}
          </Badge>
        )}
      </div>

      <div className={styles.aiBox}>
        <div className={styles.aiText}>
          {/* 다 뽑고 나면 문구가 바뀌는 것으로 끝난 걸 알린다.
              0건도 끝난 것이다 — "아직 안 뽑았다"와 섞이면 같은 버튼을 계속 누르게 된다 */}
          <span className={styles.aiTitle} aria-live="polite">
            <span className={styles.star} aria-hidden="true">
              ✦
            </span>{" "}
            {generating
              ? "회의록에서 실행 항목을 뽑고 있어요"
              : !generated
                ? "회의록에서 실행 항목을 뽑아 드릴게요"
                : items.length > 0
                  ? `이 회의록에서 실행 항목 ${items.length}건을 찾았어요`
                  : "이 회의록에서는 실행 항목을 찾지 못했어요"}
          </span>
          <span className={styles.aiDesc}>
            {!generated
              ? "에이전트가 회의록에서 '누가 언제까지 할 일'을 뽑아 드려요."
              : items.length > 0
                ? "줄마다 '할 일 추가'를 누르면 담당자·완료 목표일 그대로 바로 등록돼요."
                : "주요 내용·후속 조치에 맡을 사람이 정해진 항목이 없었어요."}
          </span>
        </div>

        <Button
          size="medium"
          type={generated ? "light" : "primary"}
          buttonStyle={generated ? "weak" : "fill"}
          loading={generating}
          onClick={onGenerate}
        >
          {generated ? "다시 생성" : "에이전트로 할 일 생성"}
        </Button>
      </div>

      {/* 버튼을 누르기 전에는 표를 열지 않는다. 0건이면 열 표도 없다 */}
      {generated && items.length > 0 && (
        <ProjectTable
          columns={columns}
          rows={items}
          rowKey={(item) => item.id}
        />
      )}
    </section>
  );
}
