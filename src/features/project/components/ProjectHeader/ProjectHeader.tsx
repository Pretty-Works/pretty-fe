"use client";

import { useEffect, useRef, useState } from "react";

import { useParams, usePathname, useRouter } from "next/navigation";

import Button from "@/components/Button/Button";

import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";
import { useChangeProjectStatusMutation } from "@/features/project/overview/hooks/mutations/useChangeProjectStatusMutation";
import { getProjectTabSegment } from "@/features/project/constants/projectTabs";
import { PROJECT_STATUS_META } from "@/features/home/constants/projectStatus";

import ProjectStatusMenu from "./ProjectStatusMenu";
import ProjectSwitchMenu from "./ProjectSwitchMenu";

import styles from "./ProjectHeader.module.css";

type OpenMenu = "status" | "switch" | null;

export default function ProjectHeader() {
  // 프로젝트 하위 모든 화면에서 쓰이므로 경로에서 직접 id를 읽는다.
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId ?? "";

  const router = useRouter();
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // 프로젝트를 바꿔도 보던 탭에 그대로 남는다 (재무 → 재무, 회의록 → 회의록).
  // 회의록 작성 같은 하위 경로는 탭 첫 화면으로 돌아간다.
  const currentTab = getProjectTabSegment(pathname);

  // 개요 화면과 같은 쿼리 키라 캐시를 공유한다 (요청이 두 번 나가지 않음).
  const { data: project, isError } = useProjectDetailQuery(projectId);
  const { mutate: changeStatus } = useChangeProjectStatusMutation(projectId);

  // 완료·보관 프로젝트는 수정할 수 없다 (BE ProjectPolicy.isOpenForContent → PROJECT_020)
  const isOpenForContent =
    !!project &&
    project.status !== "COMPLETED" &&
    project.status !== "ARCHIVED";

  // 바깥 클릭 시 닫기 (DatePicker와 동일 패턴)
  useEffect(() => {
    if (!openMenu) return;

    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openMenu]);

  const toggle = (menu: OpenMenu) =>
    setOpenMenu((prev) => (prev === menu ? null : menu));

  // 보관은 목록에서 사라지므로 화면에 남겨두지 않고 홈으로 보낸다
  const statusTone = project ? PROJECT_STATUS_META[project.status]?.tone : null;

  return (
    <div className={styles.header}>
      <div className={styles.selector} ref={rootRef}>
        {/* 색 점 — 진행 상태 변경 */}
        <button
          type="button"
          className={styles.dotButton}
          onClick={() => toggle("status")}
          /* 완료·보관 프로젝트는 상태를 되돌릴 수 없어 메뉴를 열 이유가 없다 */
          disabled={!isOpenForContent}
          aria-haspopup="menu"
          aria-expanded={openMenu === "status"}
          aria-label="프로젝트 상태 변경"
        >
          <span
            className={`${styles.dot} ${statusTone ? styles[statusTone] : ""}`}
          />
        </button>

        {/* 열 수 없는 프로젝트면 이름 자리를 비워두지 않고 상태를 알린다 */}
        <span className={`${styles.name} ${!project ? styles.namePlaceholder : ""}`}>
          {project?.name ?? (isError ? "열 수 없는 프로젝트" : "불러오는 중…")}
        </span>

        {/* 화살표 — 다른 프로젝트로 이동 */}
        <button
          type="button"
          className={styles.caretButton}
          onClick={() => toggle("switch")}
          aria-haspopup="menu"
          aria-expanded={openMenu === "switch"}
          aria-label="다른 프로젝트 선택"
        >
          <span className={styles.caret} aria-hidden="true" />
        </button>

        {openMenu === "status" && project && (
          <div className={styles.popupLeft}>
            <ProjectStatusMenu
              current={project.status}
              onChange={(status) => {
                changeStatus(status, {
                  onSuccess: () => {
                    setOpenMenu(null);
                    if (status === "ARCHIVED") router.push("/");
                  },
                });
              }}
            />
          </div>
        )}

        {openMenu === "switch" && (
          <div className={styles.popupRight}>
            <ProjectSwitchMenu
              currentProjectId={projectId}
              onSelect={(nextId) => {
                setOpenMenu(null);
                router.push(`/projects/${nextId}/${currentTab}`);
              }}
            />
          </div>
        )}
      </div>

      {isOpenForContent && (
        <Button
          status="edit"
          size="sm"
          name="프로젝트 수정"
          onClick={() => router.push(`/projects/${projectId}/edit`)}
        />
      )}
    </div>
  );
}
