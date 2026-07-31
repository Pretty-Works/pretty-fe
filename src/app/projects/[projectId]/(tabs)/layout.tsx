import ProjectHeader from "@/features/project/components/ProjectHeader/ProjectHeader";
import ProjectTabBar from "@/features/project/components/ProjectTabBar/ProjectTabBar";

import styles from "./layout.module.css";

// 프로젝트 공통 껍데기: 상단 셀렉터·수정 버튼 + 탭바 (모든 프로젝트 하위 페이지 공통).
// 프로젝트명은 ProjectHeader가 상세 조회로 직접 가져온다.
export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.container}>
      <ProjectHeader />
      <ProjectTabBar />
      {children}
    </div>
  );
}
