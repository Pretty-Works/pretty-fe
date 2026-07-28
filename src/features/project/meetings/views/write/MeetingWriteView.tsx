"use client";

import Button from "@/components/Button/Button";
import FormField from "@/components/FormField/FormField";
import FormTextArea from "@/components/FormTextArea/FormTextArea";

import styles from "./MeetingWriteView.module.css";

const AUTHOR = "김서준 · 개발팀 팀장";
const ATTENDEES = ["김서준 · 재무팀", "이하늘 · 백엔드팀"];

export default function MeetingWriteView() {
  return (
    <>
      {/* 페이지 헤더 */}
      <div className={styles.pageHead}>
        <div className={styles.pageHeadText}>
          <h2 className={styles.pageTitle}>회의록 작성</h2>
          <p className={styles.pageSub}>
            AI로 빠르고 간편하게 회의 내용을 정리해 보세요 →
          </p>
        </div>
        <div className={styles.actions}>
          <Button status="cancel" size="sm" name="취소" />
          <button type="button" className={styles.uploadBtn}>
            🎙️ 녹취록 업로드
          </button>
          <Button status="primary" size="sm" name="저장" />
        </div>
      </div>

      {/* 기본 정보 */}
      <section className={styles.card}>
        <h3 className={styles.cardTitle}>기본 정보</h3>

        <FormField label="회의명" required placeholder="회의명을 입력하세요" />

        <div className={styles.row}>
          <div className={styles.col}>
            <FormField
              label="일시"
              required
              placeholder="날짜를 선택하세요"
              rightSlot="▾"
            />
          </div>
          <div className={styles.col}>
            <FormField
              label="장소"
              placeholder="예) 본사 3F 회의실 A · 화상 병행"
            />
          </div>
        </div>

        <div className={styles.authorField}>
          <span className={styles.authorLabel}>작성자</span>
          <span className={styles.authorChip}>{AUTHOR}</span>
        </div>

        <div className={styles.attendeeField}>
          <FormField
            label="참석자"
            placeholder="이름 검색 후 Enter로 추가"
            rightSlot="Enter ↵"
          />
          <div className={styles.chips}>
            {ATTENDEES.map((name) => (
              <span key={name} className={styles.attendeeChip}>
                {name}
                <span className={styles.chipX} aria-hidden="true">
                  ✕
                </span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 회의 내용 */}
      <section className={styles.card}>
        <h3 className={styles.cardTitle}>회의 내용</h3>

        <FormField
          label="회의 목적"
          placeholder="예) 스프린트 진행상황 공유 및 다음 계획 확정"
        />

        <FormTextArea
          label="주요 내용"
          rows={6}
          placeholder={
            "안건, 논의 내용, 결정 사항, 보류 사항, 이슈 등 회의에서 오간 주요 내용을 자유롭게 작성하세요.\n\n녹취록을 업로드하면 이 영역이 AI 초안으로 채워지며, 이후 자유롭게 수정할 수 있습니다."
          }
        />

        <FormTextArea
          label="후속 조치"
          rows={5}
          placeholder={
            "실행 항목·담당자·기한, 다음 회의 일정 등 회의 이후 처리할 내용을 자유롭게 작성하세요.\n\n녹취록을 업로드하면 이 영역이 AI 초안으로 채워지며, 이후 자유롭게 수정할 수 있습니다."
          }
        />
      </section>
    </>
  );
}
