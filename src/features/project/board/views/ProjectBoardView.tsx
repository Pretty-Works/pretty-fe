"use client";

import Badge from "@/components/Badge/Badge";
import Button from "@/components/Button/Button";
import Pagination from "@/components/Pagination/Pagination";
import Result from "@/components/Result/Result";
import SearchBar from "@/components/SearchBar/SearchBar";

import ImportanceDot from "@/features/project/board/components/ImportanceDot/ImportanceDot";
import ImportanceFilter from "@/features/project/board/components/ImportanceFilter/ImportanceFilter";
import { usePostListPage } from "@/features/project/board/hooks/usePostListPage";
import type { BoardPost } from "@/features/project/board/types";
import AiSummaryCard from "@/features/project/components/AiSummaryCard/AiSummaryCard";
import ProjectTable, {
  type ProjectTableColumn,
} from "@/features/project/components/ProjectTable/ProjectTable";
import TableSkeleton from "@/features/project/components/TableSkeleton/TableSkeleton";
import { useProjectSummary } from "@/features/project/hooks/useProjectSummary";

import styles from "./ProjectBoardView.module.css";

// 좁아지면 부서 → 작성자 순으로 접힌다. 제목·중요도·일시는 목록에서 고르는 기준이라 남긴다.
const BOARD_COLUMNS: ProjectTableColumn<BoardPost>[] = [
  { key: "title", header: "제목", tone: "title" },
  {
    key: "importance",
    header: "중요도",
    width: 96,
    align: "center",
    render: (post) => <ImportanceDot importance={post.importance} round />,
  },
  { key: "author", header: "작성자", width: 110, tone: "sub", fold: "compact" },
  { key: "dept", header: "부서", width: 120, tone: "sub", fold: "narrow" },
  { key: "createdAt", header: "일시", width: 150, tone: "muted" },
];

interface ProjectBoardViewProps {
  projectId?: string;
}

export default function ProjectBoardView({ projectId }: ProjectBoardViewProps) {
  const page = usePostListPage(projectId ?? "");
  const summary = useProjectSummary(projectId ?? "", "board");

  return (
    <>
      {/* AI 요약 — 아직 만들어지지 않았으면 배너를 그리지 않는다 */}
      {summary.banner && (
        <AiSummaryCard
          headline={summary.banner.headline}
          lines={summary.banner.detail}
          stats={summary.banner.stats}
          updatedAt={summary.generatedAt}
          onRefresh={summary.refresh}
        />
      )}

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div className={styles.panelHeadLeft}>
            <h2 className={styles.panelTitle}>게시판</h2>
            {typeof page.totalCount === "number" && (
              <Badge type="elephant" badgeStyle="weak">
                {page.totalCount}
              </Badge>
            )}
          </div>
          {/* 완료·보관 프로젝트에는 글을 쓸 수 없어 버튼 자체를 감춘다 */}
          {page.canWrite && (
            <Button size="tiny" onClick={page.goWrite}>
              글쓰기
            </Button>
          )}
        </div>

        <div className={styles.filterbar}>
          <div className={styles.searchWrap}>
            <SearchBar
              placeholder="제목으로 검색"
              value={page.keyword}
              onChange={(e) => page.changeKeyword(e.target.value)}
            />
          </div>

          <ImportanceFilter value={page.filter} onChange={page.changeFilter} />
        </div>

        {page.isLoading ? (
          // 로딩 (스켈레톤)
          <TableSkeleton rows={6} />
        ) : page.isError ? (
          // 조회 실패
          <Result
            figure={<Result.Figure tone="error">❗</Result.Figure>}
            title="게시글을 불러오지 못했어요"
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
        ) : page.posts.length === 0 && (page.query || page.filter !== "ALL") ? (
          // 검색·필터 결과 없음
          <Result
            figure={<Result.Figure>🔍</Result.Figure>}
            title="검색 결과가 없습니다"
            description="조건에 맞는 게시글이 없어요. 다른 키워드나 중요도로 다시 찾아보세요."
            button={
              <Result.Button
                type="light"
                buttonStyle="weak"
                onClick={() => {
                  page.resetSearch();
                  page.changeFilter("ALL");
                }}
              >
                검색 초기화
              </Result.Button>
            }
          />
        ) : page.posts.length === 0 ? (
          // 등록된 게시글 없음
          // 더 쓸 수 없는 프로젝트라면 작성을 권하지 않는다 — 문구도 버튼도 뺀다
          <Result
            figure={<Result.Figure>📋</Result.Figure>}
            title="등록된 게시글이 없습니다"
            description={
              page.canWrite
                ? "첫 글을 남기면 공지·이슈·논의 내용을 팀원과 한곳에서 나눌 수 있어요."
                : "완료된 프로젝트라 글을 새로 작성할 수 없어요."
            }
            button={
              page.canWrite ? (
                <Result.Button leftAccessory="+" onClick={page.goWrite}>
                  글쓰기
                </Result.Button>
              ) : undefined
            }
          />
        ) : (
          <ProjectTable
            columns={BOARD_COLUMNS}
            rows={page.posts}
            rowKey={(post) => post.id}
            onRowClick={(post) => page.goDetail(post.id)}
          />
        )}

        {!page.isLoading &&
          !page.isError &&
          page.posts.length > 0 &&
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
