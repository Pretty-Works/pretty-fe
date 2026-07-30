"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import Button from "@/components/Button/Button";
import Chip from "@/components/Chip/Chip";
import MeetingActionItems from "@/features/project/meetings/components/MeetingActionItems/MeetingActionItems";
import MeetingForm from "@/features/project/meetings/components/MeetingForm/MeetingForm";
import type { MeetingData } from "@/features/project/meetings/types";
import { formatDateLabel } from "@/lib/date";

import styles from "./MeetingDetailView.module.css";

// UI 하드코딩 (API 연결 예정)
const MEETING: MeetingData = {
  title: "2월 4주차 스프린트 리뷰",
  code: "#260226-PW-01",
  date: "2026-02-26",
  place: "본사 3F 회의실 A",
  project: "그룹웨어 AI 고도화",
  author: "김서준 · 개발팀 팀장",
  attendees: [
    "김서준 · PM",
    "정우진 · LLM팀",
    "이하늘 · 백엔드팀",
    "최유나 · 프론트팀",
    "한도윤 · 재무팀",
  ],
  transcript: "sprint_review_0226.m4a",
  purpose: "스프린트 진행상황 공유 및 다음 스프린트 계획 확정",
  content:
    "안건 1. 백엔드 API 진행상황\n커서 기반 페이지네이션 68% 완료. 응답속도 개선이 확인되었고 3/4까지 마무리 예정. 부하 테스트 필요성이 제기됨.\n\n안건 2. LLM 스펙 확정\n아키텍처 방향은 합의 완료. 다음 주 스펙 리뷰 후 3주차에 확정하기로 함.\n\n결정 사항\n· 3/4까지 커서 전환 마무리\n· LLM 스펙 3주차 확정\n\n보류 · 이슈\n· 검색 인덱스 v2 적용은 다음 스프린트로 보류\n· 데이터팀 인력 부족으로 부하 테스트 일정 지연 가능",
  followup:
    "· 커서 페이지네이션 3/4까지 마무리 (백엔드)\n· LLM 스펙 3주차 확정 후 문서화\n· 부하 테스트 시나리오 준비 — 데이터팀 인력 확보 필요",
  actionItems: [
    {
      task: "커서 페이지네이션 마무리",
      owner: "이하늘",
      due: "2026-03-04",
      status: "진행중",
    },
    {
      task: "LLM 스펙 문서화",
      owner: "정우진",
      due: "2026-03-06",
      status: "예정",
    },
    {
      task: "부하 테스트 시나리오 작성",
      owner: "한도윤",
      due: "2026-03-05",
      status: "예정",
    },
  ],
};

// 회의록 상세 (읽기전용 + 수정 토글)
export default function MeetingDetailView() {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <MeetingForm
        mode="edit"
        initial={MEETING}
        onExit={() => setEditing(false)}
      />
    );
  }

  return (
    <>
      <div className={styles.head}>
        <div className={styles.headText}>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>{MEETING.title}</h2>
            {MEETING.code && <span className={styles.code}>{MEETING.code}</span>}
          </div>
          <p className={styles.sub}>
            {formatDateLabel(MEETING.date)}
            {MEETING.place ? ` · ${MEETING.place}` : ""}
          </p>
        </div>

        <div className={styles.actions}>
          <Button
            status="cancel"
            size="sm"
            name="목록"
            onClick={() => router.back()}
          />
          <Button status="cancel" size="sm" name="삭제" />
          <Button
            status="primary"
            size="sm"
            name="수정"
            onClick={() => setEditing(true)}
          />
        </div>
      </div>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>기본 정보</h3>

        <div className={styles.infoRow}>
          <div className={styles.infoCol}>
            <span className={styles.infoLabel}>프로젝트</span>
            <span className={styles.infoValue}>{MEETING.project}</span>
          </div>
          <div className={styles.infoCol}>
            <span className={styles.infoLabel}>작성자</span>
            <span className={styles.infoValue}>{MEETING.author}</span>
          </div>
        </div>

        <div className={styles.infoBlock}>
          <span className={styles.infoLabel}>
            참석자 ({MEETING.attendees.length}명)
          </span>
          <div className={styles.chips}>
            {MEETING.attendees.map((a) => (
              <Chip key={a} label={a} />
            ))}
          </div>
        </div>

        {MEETING.transcript && (
          <div className={styles.transcript}>
            <span aria-hidden="true">🎙️</span>
            <span>녹취록 기반 AI 생성 : {MEETING.transcript}</span>
          </div>
        )}
      </section>

      <section className={styles.card}>
        <div className={styles.field}>
          <h4 className={styles.fieldLabel}>회의 목적</h4>
          <p className={styles.fieldText}>{MEETING.purpose}</p>
        </div>
        <div className={styles.field}>
          <h4 className={styles.fieldLabel}>주요 내용</h4>
          <p className={styles.fieldText}>{MEETING.content}</p>
        </div>
        <div className={styles.field}>
          <h4 className={styles.fieldLabel}>후속 조치</h4>
          <p className={styles.fieldText}>{MEETING.followup}</p>
        </div>
      </section>

      <MeetingActionItems items={MEETING.actionItems ?? []} />
    </>
  );
}
