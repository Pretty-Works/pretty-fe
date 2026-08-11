"use client";

import Button from "@/components/Button/Button";

import type { ProjectSummarySection } from "@/features/project/api/projectSummaryApi";
import AiSummaryCard from "@/features/project/components/AiSummaryCard/AiSummaryCard";
import { hasManagedSummary } from "@/features/project/constants/projectStatus";
import { useProjectSummary } from "@/features/project/hooks/useProjectSummary";
import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";

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
 *
 * 진행·보류가 아닌 프로젝트에는 배너를 두지 않는다. 야간 배치가 그 둘만 다시 만들어서
 * (BE ProjectSummaryScheduler) 나머지는 배너가 낡은 채로 남는데, 조회가 곧 생성이라
 * (BE read-through) 그 낡은 배너를 화면이 탭마다 새로 만들며 LLM 비용을 쓰게 된다.
 */
export default function ProjectAiSummary({
  projectId,
  section,
}: ProjectAiSummaryProps) {
  // 상단바·좌측 메뉴가 이미 읽어 둔 쿼리라 요청이 늘지 않는다
  const { data: project, isError: isProjectError } =
    useProjectDetailQuery(projectId);
  const managed = !!project && hasManagedSummary(project.status);

  // 상태를 알기 전에는 조회하지 않는다 — 여기서 미리 부르면 숨길 프로젝트에서도
  // 요약 요청이 한 번 나가 숨기는 의미가 없어진다.
  const summary = useProjectSummary(projectId, section, managed);

  // 프로젝트를 못 읽었을 때도 자리를 비운다. 상태를 모르는 채 요약을 부르면 숨기려던
  // 프로젝트에서 요청이 나가고, 그 실패는 이미 화면의 다른 곳이 알리고 있다.
  if (isProjectError || (project && !managed)) return null;

  // 첫 조회 — 자리를 잡아 둬야 배너가 뜰 때 아래 내용이 밀리지 않는다.
  // 프로젝트 상태를 기다리는 동안도 같은 자리를 잡아 둔다.
  if (!project || summary.isLoading) {
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
