"use client";

import { useRouter } from "next/navigation";

import Button from "@/components/Button/Button";
import ImportanceDot from "@/features/project/board/components/ImportanceDot/ImportanceDot";
import type { PostDetail } from "@/features/project/board/types";

import styles from "./PostDetailView.module.css";

const POST: PostDetail = {
  id: "1",
  title: "검색 인덱스 v2 전환 리스크 공유",
  importance: "HIGH",
  author: "이하늘",
  dept: "백엔드팀",
  date: "2026-02-26 (목)",
  content: `이번 스프린트에서 진행한 검색 인덱스 v2 전환 관련 주요 리스크를 공유드립니다.

1. 데이터 마이그레이션
기존 인덱스(약 1,200만 건)를 v2 스키마로 재색인해야 하며, 전환 중 약 2시간의 검색 지연이 예상됩니다.

2. 롤백 플랜
전환 실패 시 v1 인덱스로 즉시 롤백 가능하도록 이중 색인 구조를 유지합니다.

3. 일정
3월 2일(월) 새벽 트래픽이 낮은 시간대에 전환을 진행할 예정이며, QA팀과 사전 점검을 완료했습니다.

관련 문의는 댓글로 남겨주세요.`,
};

interface PostDetailViewProps {
  projectId?: string;
}

export default function PostDetailView({ projectId }: PostDetailViewProps) {
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        className={styles.backBtn}
        onClick={() => router.back()}
      >
        <span className={styles.backIcon} aria-hidden="true">
          ←
        </span>
        뒤로가기
      </button>

      <div className={styles.head}>
        <div className={styles.headText}>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>{POST.title}</h2>
            <ImportanceDot importance={POST.importance} size={10} round />
          </div>
          <div className={styles.meta}>
            <span className={styles.author}>{POST.author}</span>
            <span className={styles.dept}>· {POST.dept}</span>
            <span className={styles.date}>{POST.date}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            status="primary"
            size="sm"
            name="수정"
            onClick={() => router.push(`/projects/${projectId}/board/write`)}
          />
        </div>
      </div>

      <section className={styles.card}>
        <p className={styles.content}>{POST.content}</p>
      </section>
    </>
  );
}
