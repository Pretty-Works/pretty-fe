"use client";

import Badge from "@/components/Badge/Badge";
import { useState } from "react";

import { useRouter } from "next/navigation";

import Button from "@/components/Button/Button";
import SearchBar from "@/components/SearchBar/SearchBar";

import AiSummaryCard from "@/features/project/components/AiSummaryCard/AiSummaryCard";
import ProjectTable, { type ProjectTableColumn } from "@/features/project/components/ProjectTable/ProjectTable";
import ImportanceDot from "@/features/project/board/components/ImportanceDot/ImportanceDot";
import ImportanceFilter, { type ImportanceFilterValue } from "@/features/project/board/components/ImportanceFilter/ImportanceFilter";
import type { BoardPost } from "@/features/project/board/types";

import styles from "./ProjectBoardView.module.css";

const MOCK_POSTS: BoardPost[] = [
  {
    id: "1",
    title: "부하 테스트 착수 지연 관련 공유",
    importance: "HIGH",
    author: "김서준",
    dept: "PM",
    createdAt: "2026-02-27 09:12",
  },
  {
    id: "2",
    title: "2월 데모 데이 일정 2/28(금)로 확정",
    importance: "MEDIUM",
    author: "김서준",
    dept: "PM",
    createdAt: "2026-02-26 18:03",
  },
  {
    id: "3",
    title: "LLM 스펙 합의 관련 진행 상황",
    importance: "MEDIUM",
    author: "정우진",
    dept: "LLM팀",
    createdAt: "2026-02-25 11:40",
  },
  {
    id: "4",
    title: "디자인 QA 체크리스트 공유합니다",
    importance: "LOW",
    author: "이하늘",
    dept: "백엔드팀",
    createdAt: "2026-02-25 09:20",
  },
  {
    id: "5",
    title: "이번 주 진행 요약 정리",
    importance: "LOW",
    author: "최유나",
    dept: "프론트팀",
    createdAt: "2026-02-24 17:55",
  },
];

const TOTAL_COUNT = 58;

const BOARD_COLUMNS: ProjectTableColumn<BoardPost>[] = [
  { key: "title", header: "제목", tone: "title" },
  {
    key: "importance",
    header: "중요도",
    width: 96,
    align: "center",
    render: (post) => <ImportanceDot importance={post.importance} round />,
  },
  { key: "author", header: "작성자", width: 110, tone: "sub" },
  { key: "dept", header: "부서", width: 120, tone: "sub" },
  { key: "createdAt", header: "일시", width: 150, tone: "muted" },
];

interface ProjectBoardViewProps {
  projectId?: string;
}

export default function ProjectBoardView({ projectId }: ProjectBoardViewProps) {
  const router = useRouter();

  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<ImportanceFilterValue>("ALL");

  const q = keyword.trim();
  const posts = MOCK_POSTS.filter(
    (post) =>
      (filter === "ALL" || post.importance === filter) &&
      (q === "" || post.title.includes(q)),
  );

  return (
    <>
      <AiSummaryCard
        headline="게시판에 High 리스크 글 2건, 우선 확인이 필요해요"
        lines={[
          "전체 58건 중 부하 테스트 지연·배포 논의가 High 리스크예요",
          "LLM 스펙 합의, QA 세팅 등 Medium 리스크 글이 3건 있어요",
          "High 리스크 글부터 먼저 확인하는 걸 추천해요",
        ]}
        stats={[
          { label: "전체", value: "58건" },
          { label: "High", value: "2건", tone: "danger" },
          { label: "Medium", value: "3건", tone: "warning" },
        ]}
      />

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div className={styles.panelHeadLeft}>
            <h2 className={styles.panelTitle}>게시판</h2>
            <Badge type="elephant" badgeStyle="weak">{TOTAL_COUNT}</Badge>
          </div>
          <Button
            size="tiny"
            onClick={() => router.push(`/projects/${projectId}/board/write`)}
          >
            글쓰기
          </Button>
        </div>

        <div className={styles.filterbar}>
          <div className={styles.searchWrap}>
            <SearchBar
              placeholder="제목으로 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <ImportanceFilter value={filter} onChange={setFilter} />
        </div>

        <ProjectTable
          columns={BOARD_COLUMNS}
          rows={posts}
          rowKey={(post) => post.id}
          onRowClick={(post) =>
            router.push(`/projects/${projectId}/board/${post.id}`)
          }
        />
      </section>
    </>
  );
}
