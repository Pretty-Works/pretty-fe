import ProjectHeaderContainer from "@/features/project/components/ProjectHeader/ProjectHeaderContainer";
import ProjectLnb from "@/features/project/components/ProjectLnb/ProjectLnb";

import styles from "./layout.module.css";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <ProjectLnb />

        <div className={styles.content}>
          <ProjectHeaderContainer />
          {children}
        </div>
      </div>
    </div>
  );
}
