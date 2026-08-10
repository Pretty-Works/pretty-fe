"use client";

import Button from "@/components/Button/Button";

import type { ProjectSummarySection } from "@/features/project/api/projectSummaryApi";
import AiSummaryCard from "@/features/project/components/AiSummaryCard/AiSummaryCard";
import { useProjectSummary } from "@/features/project/hooks/useProjectSummary";

import styles from "./ProjectAiSummary.module.css";

interface ProjectAiSummaryProps {
  projectId: string;
  section: ProjectSummarySection;
}

/**
 * 프로젝트 탭 상단의 AI 요약 배너.
 *
 * 배너는 화면의 부가 정보라 서버도 실패를 삼키고 빈 배열을 준다. 그래서 "없음"은
 * 세 가지 뜻이 되는데(아직 안 만듦 · 만들다 실패 · 조회 자체가 실패), 넷 다 아무것도
 * 안 그리면 사용자는 이 자리에 무엇이 있어야 하는지조차 알 수 없다. 여기서 갈라 준다.
 */
export default function ProjectAiSummary({
  projectId,
  section,
}: ProjectAiSummaryProps) {
  const summary = useProjectSummary(projectId, section);

  // 첫 조회 — 자리를 잡아 둬야 배너가 뜰 때 아래 내용이 밀리지 않는다
  if (summary.isLoading) {
    return (
      <div
        className={styles.shell}
        role="status"
        aria-label="AI 요약을 불러오는 중이에요"
      >
        <div className={styles.head}>
          <span className={`${styles.bar} ${styles.badge}`} />
          <span className={`${styles.bar} ${styles.headline}`} />
        </div>
        <span className={`${styles.bar} ${styles.line}`} />
        <span className={`${styles.bar} ${styles.lineShort}`} />
      </div>
    );
  }

  // 참여자가 아니거나 네트워크가 끊긴 경우. 배너 하나 때문에 화면을 막지는 않고 이 줄만 남긴다
  if (summary.isError) {
    return (
      <div className={`${styles.shell} ${styles.notice}`} role="alert">
        <div className={styles.noticeText}>
          <span className={styles.noticeTitle}>
            AI 요약을 불러오지 못했어요
          </span>
          <span className={styles.noticeDesc}>
            일시적인 오류일 수 있어요. 잠시 후 다시 시도해 주세요.
          </span>
        </div>
        <Button
          type="light"
          buttonStyle="weak"
          size="medium"
          onClick={() => void summary.retry()}
        >
          ↻ 다시 시도
        </Button>
      </div>
    );
  }

  // 조회는 됐는데 이 탭 배너가 없다 — 아직 안 만들었거나, 만들다 실패했다.
  // 어느 쪽이든 사용자가 할 수 있는 일은 같아서 한 화면으로 합친다.
  if (!summary.banner) {
    return (
      <div className={`${styles.shell} ${styles.notice}`}>
        <div className={styles.noticeText}>
          <span className={styles.noticeTitle}>아직 AI 요약이 없어요</span>
          <span className={styles.noticeDesc}>
            지금까지 쌓인 내용을 모아 이 탭의 요약을 만들어 드릴게요.
          </span>
        </div>
        <Button
          size="medium"
          loading={summary.isRefreshing}
          onClick={() => void summary.refresh()}
        >
          요약 생성
        </Button>
      </div>
    );
  }

  return (
    <AiSummaryCard
      headline={summary.banner.headline}
      lines={summary.banner.detail}
      stats={summary.banner.stats}
      updatedAt={summary.generatedAt}
      onRefresh={summary.refresh}
    />
  );
}
