import Button from "@/components/Button/Button";
import type { MeetingActionItem } from "@/features/project/meetings/types";

import styles from "./MeetingActionItems.module.css";

interface MeetingActionItemsProps {
  items: MeetingActionItem[];
}

// 회의록 실행 항목
export default function MeetingActionItems({ items }: MeetingActionItemsProps) {
  if (items.length === 0) return null;

  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitle}>실행 항목</h3>

      <div className={styles.aiBox}>
        <div className={styles.aiText}>
          <span className={styles.aiTitle}>
            <span className={styles.star} aria-hidden="true">
              ✦
            </span>{" "}
            이 회의록에서 실행 항목 {items.length}건을 찾았어요
          </span>
          <span className={styles.aiDesc}>
            에이전트가 담당자·완료 목표일을 반영해 각 담당자의 할 일로 등록하고
            알림을 보냅니다.
          </span>
        </div>
        <Button size="medium">에이전트로 할 일 생성</Button>
      </div>

      <div className={styles.taskTable} role="table">
        <div className={`${styles.taskRow} ${styles.taskHead}`} role="row">
          <span className={styles.colTask}>실행 항목</span>
          <span className={styles.colOwner}>담당자</span>
          <span className={styles.colDue}>완료 목표일</span>
          <span className={styles.colStatus}>상태</span>
          <span className={styles.colAdd} />
        </div>

        {items.map((item) => (
          <div key={item.task} className={styles.taskRow} role="row">
            <span className={styles.colTask}>{item.task}</span>
            <span className={styles.colOwner}>{item.owner}</span>
            <span className={styles.colDue}>{item.due}</span>
            <span className={styles.colStatus}>
              <span
                className={`${styles.pill} ${
                  item.status === "진행중"
                    ? styles.pillActive
                    : item.status === "완료"
                      ? styles.pillDone
                      : styles.pillPlanned
                }`}
              >
                {item.status}
              </span>
            </span>
            <button type="button" className={styles.addTask}>
              + 할 일 추가
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
