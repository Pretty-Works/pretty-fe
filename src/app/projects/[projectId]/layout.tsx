import ProjectHeader from "@/features/project/components/ProjectHeader/ProjectHeader";
import ProjectTabBar from "@/features/project/components/ProjectTabBar/ProjectTabBar";

import styles from "./layout.module.css";

// 프로젝트 공통 껍데기: 상단 셀렉터·수정 버튼 + 탭바 (모든 프로젝트 하위 페이지 공통).
// API 연결 전이라 프로젝트명은 임시 하드코딩.
const PROJECT_NAME = "그룹웨어 AI 고도화";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.container}>
      <ProjectHeader projectName={PROJECT_NAME} />
      <ProjectTabBar />
      {children}
    </div>
  );
}
