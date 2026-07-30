"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import Button from "@/components/Button/Button";
import SearchBar from "@/components/SearchBar/SearchBar";
import AiSummaryCard from "@/features/project/components/AiSummaryCard/AiSummaryCard";
import ProjectTable from "@/features/project/components/ProjectTable/ProjectTable";
import Pagination from "@/components/Pagination/Pagination";

import { useMeetingQuery } from "@/features/project/meetings/hooks/queries/useMeetingQuery";

import styles from "./ProjectMeetingView.module.css";

const TOKEN = "";

interface ProjectMeetingViewProps {
  projectId?: string;
}

export default function ProjectMeetingView({
  projectId,
}: ProjectMeetingViewProps) {
  const router = useRouter();

  const [keyword, setKeyword] = useState(""); // 검색창
  const [page, setPage] = useState(1); // 페이지네이션

  const {
    data: meetings = [],
    isLoading,
    isError,
  } = useMeetingQuery(projectId ?? "", TOKEN, {
    title: keyword,
    page: page - 1,
    size: 15,
  });

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
          <Button
            name="작성하기"
            size="xs"
            onClick={() => router.push(`/projects/${projectId}/meetings/write`)}
          />
        </div>

        <div className={styles.filterbar}>
          <SearchBar
            placeholder="제목 · 참석자로 검색"
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        {isLoading ? (
          <p className={styles.stateText}>회의록을 불러오는 중이에요…</p>
        ) : isError ? (
          <p className={`${styles.stateText} ${styles.stateError}`}>
            회의록을 불러오지 못했어요.
          </p>
        ) : meetings.length === 0 ? (
          <p className={styles.stateText}>표시할 회의록이 없어요.</p>
        ) : (
          <ProjectTable meetings={meetings} />
        )}

        {meetings.length / 15 > 1 && (
          <Pagination
            currentPage={page}
            totalPages={meetings.length / 15 + 1}
            onPageChange={setPage}
          />
        )}
      </section>
    </>
  );
}