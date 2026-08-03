"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import Button from "@/components/Button/Button";
import SearchBar from "@/components/SearchBar/SearchBar";
import AiSummaryCard from "@/features/project/components/AiSummaryCard/AiSummaryCard";
import ProjectTable, {
  type ProjectTableColumn,
} from "@/features/project/components/ProjectTable/ProjectTable";
import type { Meeting } from "@/features/project/meetings/api/meetingApi";
import StateView from "@/features/project/meetings/components/StateView/StateView";
import TableSkeleton from "@/features/project/meetings/components/TableSkeleton/TableSkeleton";

import styles from "./ProjectMeetingView.module.css";

const MOCK_MEETINGS: Meeting[] = [
  {
    id: "1",
    title: "2월 4주차 스프린트 리뷰",
    author: "김서준",
    attendees: ["김서준", "이하늘", "정우진", "박지민", "최유나"],
    date: "2026-02-26",
  },
  {
    id: "2",
    title: "요구 재정의 킥오프",
    author: "정우진",
    attendees: ["정우진", "한도윤", "김민서", "이서연"],
    date: "2026-02-20",
  },
  {
    id: "3",
    title: "검색 인덱스 설계 논의",
    author: "이하늘",
    attendees: ["이하늘", "김서준", "정우진"],
    date: "2026-02-14",
  },
  {
    id: "4",
    title: "1월 회고 및 목표 설정",
    author: "김서준",
    attendees: ["김서준", "이하늘", "한도윤", "정우진", "김민서", "최유나"],
    date: "2026-02-10",
  },
];

// 목록에 표시할 참석자 수 (초과분은 "외 N명")
const VISIBLE_ATTENDEES = 3;

// 회의록 목록 컬럼 정의 (공용 ProjectTable에 주입)
const MEETING_COLUMNS: ProjectTableColumn<Meeting>[] = [
  { key: "title", header: "제목", tone: "title" },
  { key: "author", header: "작성자", width: 110, tone: "sub" },
  {
    key: "attendees",
    header: "참석자",
    width: 250,
    tone: "sub",
    render: (meeting) => {
      const shown = meeting.attendees.slice(0, VISIBLE_ATTENDEES).join(", ");
      const rest = Math.max(0, meeting.attendees.length - VISIBLE_ATTENDEES);

      return (
        <>
          <span className={styles.attendeeClip}>{shown}</span>
          {rest > 0 && <span className={styles.attendeeRest}>외 {rest}명</span>}
        </>
      );
    },
  },
  { key: "date", header: "일시", width: 150, tone: "muted" },
];

type LoadStatus = "loading" | "error" | "ready";

interface ProjectMeetingViewProps {
  projectId?: string;
}

export default function ProjectMeetingView({
  projectId,
}: ProjectMeetingViewProps) {
  const router = useRouter();

  const [status, setStatus] = useState<LoadStatus>("loading");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [keyword, setKeyword] = useState("");
  const [reloadNonce, setReloadNonce] = useState(0);

  // 목록 로드 (API 연결 예정) — 목업 지연
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      setMeetings(MOCK_MEETINGS);
      setStatus("ready");
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [reloadNonce]);

  // 다시 시도
  const reload = () => {
    setStatus("loading");
    setMeetings([]);
    setReloadNonce((n) => n + 1);
  };

  const q = keyword.trim();
  const filtered = q
    ? meetings.filter(
        (m) => m.title.includes(q) || m.attendees.some((a) => a.includes(q)),
      )
    : meetings;

  const goWrite = () => router.push(`/projects/${projectId}/meetings/write`);

  return (
    <>
      {/* AI 요약 */}
      <AiSummaryCard
        headline="이번 주 회의 4건이 기록됐고, 후속 액션 정리가 필요해요"
        lines={[
          "2월 4주차 스프린트 리뷰(2/26) 후속 액션 정리가 필요해요",
          "요구 재정의 킥오프·검색 인덱스 설계 논의는 완료됐어요",
          "다음 회의 안건은 아직 등록되지 않았어요",
        ]}
        stats={[
          { label: "회의", value: "4건" },
          { label: "후속 액션", value: "미정리", tone: "warning" },
          { label: "다음 안건", value: "미등록", tone: "danger" },
        ]}
      />

      {/* 회의록 */}
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle}>회의록</h2>
          <Button name="작성하기" size="xs" onClick={goWrite} />
        </div>

        <div className={styles.filterbar}>
          <SearchBar
            placeholder="제목 · 참석자로 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        {status === "loading" ? (
          // 로딩 (스켈레톤)
          <TableSkeleton rows={6} />
        ) : status === "error" ? (
          // 조회 실패
          <StateView
            tone="error"
            icon="❗"
            title="회의록을 불러오지 못했어요"
            description="일시적인 네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 문의해 주세요."
            action={{ label: "↻ 다시 시도", onClick: reload, variant: "outline" }}
          />
        ) : filtered.length === 0 && q ? (
          // 검색 결과 없음
          <StateView
            icon="🔍"
            title="검색 결과가 없습니다"
            description={`‘${q}’와 일치하는 회의록이 없어요. 다른 키워드로 다시 검색해 보세요.`}
            action={{
              label: "검색 초기화",
              onClick: () => setKeyword(""),
              variant: "outline",
            }}
          />
        ) : meetings.length === 0 ? (
          // 등록된 회의록 없음
          <StateView
            icon="📄"
            title="등록된 회의록이 없습니다"
            description="첫 회의록을 작성하면 참석자·안건·후속 액션을 한곳에서 관리하고, AI가 핵심 논의를 요약해 드려요."
            action={{ label: "＋ 회의록 작성", onClick: goWrite }}
          />
        ) : (
          <ProjectTable
            columns={MEETING_COLUMNS}
            rows={filtered}
            rowKey={(m) => m.id}
            onRowClick={(m) =>
              router.push(`/projects/${projectId}/meetings/${m.id}`)
            }
          />
        )}
      </section>
    </>
  );
}
