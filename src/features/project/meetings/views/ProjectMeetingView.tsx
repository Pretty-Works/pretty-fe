"use client";

import Badge from "@/components/Badge/Badge";
import Button from "@/components/Button/Button";
import Pagination from "@/components/Pagination/Pagination";
import Result from "@/components/Result/Result";
import SearchBar from "@/components/SearchBar/SearchBar";

import ProjectAiSummary from "@/features/project/components/ProjectAiSummary/ProjectAiSummary";
import ProjectTable, {
  type ProjectTableColumn,
} from "@/features/project/components/ProjectTable/ProjectTable";
import TableSkeleton from "@/features/project/components/TableSkeleton/TableSkeleton";
import type { Meeting } from "@/features/project/meetings/api/meetingApi";
import { useMeetingListPage } from "@/features/project/meetings/hooks/useMeetingListPage";

import styles from "./ProjectMeetingView.module.css";

// 목록에 표시할 참석자 수 (초과분은 "외 N명")
const VISIBLE_ATTENDEES = 3;

// 회의록 목록 컬럼
// 좁아지면 참석자 → 작성자 순으로 접힌다. 참석자는 폭을 가장 많이 쓰면서
// 목록에서는 훑어보는 값이라 먼저 접고, 제목·일시는 끝까지 남긴다.
const MEETING_COLUMNS: ProjectTableColumn<Meeting>[] = [
  { key: "title", header: "제목", tone: "title" },
  { key: "author", header: "작성자", width: 110, tone: "sub", fold: "compact" },
  {
    key: "attendees",
    header: "참석자",
    width: 250,
    tone: "sub",
    fold: "narrow",
    render: (meeting) => {
      const attendees = meeting.attendees ?? [];
      const shown = attendees.slice(0, VISIBLE_ATTENDEES).join(", ");
      const rest = Math.max(0, attendees.length - VISIBLE_ATTENDEES);

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

interface ProjectMeetingViewProps {
  projectId?: string;
}

export default function ProjectMeetingView({
  projectId,
}: ProjectMeetingViewProps) {
  const page = useMeetingListPage(projectId ?? "");

  return (
    <>
      {/* AI 요약 — 로딩·실패·요약 없음까지 배너 자리에서 알린다 */}
      <ProjectAiSummary projectId={projectId ?? ""} section="meeting" />

      {/* 회의록 */}
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div className={styles.panelHeadLeft}>
            <h2 className={styles.panelTitle}>회의록</h2>
            {typeof page.totalCount === "number" && (
              <Badge type="elephant" badgeStyle="weak">
                {page.totalCount}
              </Badge>
            )}
          </div>
          {/* 완료·보관 프로젝트에는 회의록을 쓸 수 없어 버튼 자체를 감춘다 */}
          {page.canWrite && (
            <Button size="tiny" onClick={page.goWrite}>
              작성하기
            </Button>
          )}
        </div>

        <div className={styles.filterbar}>
          <SearchBar
            placeholder="제목으로 검색"
            value={page.keyword}
            onChange={(e) => page.changeKeyword(e.target.value)}
          />
        </div>

        {page.isLoading ? (
          // 로딩 (스켈레톤)
          <TableSkeleton rows={6} />
        ) : page.isError ? (
          // 조회 실패
          <Result
            figure={<Result.Figure tone="error">❗</Result.Figure>}
            title="회의록을 불러오지 못했어요"
            description="일시적인 네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 문의해 주세요."
            button={
              <Result.Button
                type="light"
                buttonStyle="weak"
                onClick={() => void page.retry()}
              >
                ↻ 다시 시도
              </Result.Button>
            }
          />
        ) : page.meetings.length === 0 && page.query ? (
          // 검색 결과 없음
          <Result
            figure={<Result.Figure>🔍</Result.Figure>}
            title="검색 결과가 없습니다"
            description={`‘${page.query}’와 일치하는 회의록이 없어요. 다른 키워드로 다시 검색해 보세요.`}
            button={
              <Result.Button
                type="light"
                buttonStyle="weak"
                onClick={page.resetSearch}
              >
                검색 초기화
              </Result.Button>
            }
          />
        ) : page.meetings.length === 0 ? (
          // 등록된 회의록 없음
          // 더 쓸 수 없는 프로젝트라면 작성을 권하지 않는다 — 문구도 버튼도 뺀다
          <Result
            figure={<Result.Figure>📄</Result.Figure>}
            title="등록된 회의록이 없습니다"
            description={
              page.canWrite
                ? "첫 회의록을 작성하면 참석자·안건·후속 액션을 한곳에서 관리하고, AI가 핵심 논의를 요약해 드려요."
                : "완료된 프로젝트라 회의록을 새로 작성할 수 없어요."
            }
            button={
              page.canWrite ? (
                <Result.Button leftAccessory="+" onClick={page.goWrite}>
                  회의록 작성
                </Result.Button>
              ) : undefined
            }
          />
        ) : (
          <ProjectTable
            columns={MEETING_COLUMNS}
            rows={page.meetings}
            rowKey={(meeting) => meeting.id}
            onRowClick={(meeting) => page.goDetail(meeting.id)}
          />
        )}

        {!page.isLoading &&
          !page.isError &&
          page.meetings.length > 0 &&
          page.totalPages > 1 && (
            <Pagination
              currentPage={page.page}
              totalPages={page.totalPages}
              onPageChange={page.setPage}
            />
          )}
      </section>
    </>
  );
}
