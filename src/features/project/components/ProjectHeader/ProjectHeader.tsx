"use client";

import { useRef, useState } from "react";

import { cx } from "@/lib/cx";

import ConfirmDialog from "@/components/ConfirmDialog/ConfirmDialog";
import { useClickOutside } from "@/hooks/useClickOutside";
import { PROJECT_STATUS_META } from "@/features/project/constants/projectStatus";
import { useProjectHeaderController } from "@/features/project/hooks/useProjectHeaderController";

import ProjectMemberMenu from "./ProjectMemberMenu/ProjectMemberMenu";
import ProjectStatusMenu from "./ProjectStatusMenu/ProjectStatusMenu";
import ProjectSwitchMenu from "./ProjectSwitchMenu/ProjectSwitchMenu";

import styles from "./ProjectHeader.module.css";

type OpenMenu = "status" | "switch" | "members" | null;

export default function ProjectHeader() {
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const {
    projectId,
    project,
    isError,
    canChangeStatus,
    confirm,
    isChangingStatus,
    selectStatus,
    selectProject,
    closeConfirm,
    confirmStatus,
  } = useProjectHeaderController();

  useClickOutside(rootRef, () => setOpenMenu(null), openMenu !== null);

  const toggle = (menu: OpenMenu) =>
    setOpenMenu((prev) => (prev === menu ? null : menu));

  // 보관은 목록에서 사라지므로 화면에 남겨두지 않고 홈으로 보낸다
  const statusTone =
    project && project.status !== "ARCHIVED"
      ? PROJECT_STATUS_META[project.status].tone
      : null;

  // 바깥 클릭 감지는 헤더 전체를 기준으로 한다 — 멤버 버튼이 selector 밖으로 나가 있다
  return (
    <div className={styles.header} ref={rootRef}>
      <div className={styles.selector}>
        {/* 색 점 — 진행 상태 변경 */}
        <button
          type="button"
          className={styles.dotButton}
          onClick={() => toggle("status")}
          disabled={!canChangeStatus}
          aria-haspopup="menu"
          aria-expanded={openMenu === "status"}
          aria-label="프로젝트 상태 변경"
        >
          <span className={cx(styles.dot, statusTone && styles[statusTone])} />
        </button>

        {/* 이름 + 화살표 — 통째로 눌러 다른 프로젝트로 이동.
            이름까지 누를 수 있어야 10px짜리 화살표를 조준하지 않아도 된다.
            버튼 글자가 곧 이름이라 aria-label을 따로 두지 않는다(이름을 덮어쓴다) */}
        <button
          type="button"
          className={styles.switchButton}
          onClick={() => toggle("switch")}
          aria-haspopup="menu"
          aria-expanded={openMenu === "switch"}
        >
          {/* 열 수 없는 프로젝트면 이름 자리를 비워두지 않고 상태를 알린다 */}
          <span className={cx(styles.name, !project && styles.namePlaceholder)}>
            {project?.name ??
              (isError ? "열 수 없는 프로젝트" : "불러오는 중…")}
          </span>

          <span className={styles.caret} aria-hidden="true" />
        </button>

        {openMenu === "status" && project && (
          <div className={styles.popupLeft}>
            <ProjectStatusMenu
              current={project.status}
              onChange={(status) =>
                selectStatus(status, () => setOpenMenu(null))
              }
            />
          </div>
        )}

        {openMenu === "switch" && (
          <div className={styles.popupRight}>
            <ProjectSwitchMenu
              currentProjectId={projectId}
              onSelect={(nextId) => {
                setOpenMenu(null);

                selectProject(nextId);
              }}
            />
          </div>
        )}
      </div>

      {/* 멤버 — 네 탭 어디서나 참여자를 확인한다.
          이름 옆이 아니라 헤더 오른쪽 끝에 세운다 (space-between) */}
      <div className={styles.memberArea}>
        <button
          type="button"
          className={styles.memberButton}
          onClick={() => toggle("members")}
          disabled={!project}
          aria-haspopup="menu"
          aria-expanded={openMenu === "members"}
        >
          멤버
          {/* 명단을 열기 전에도 규모를 알 수 있게 상세 응답의 인원수를 먼저 쓴다.
              (오너 + 참여자 — 멤버 API의 명단과 같은 사람들이다) */}
          {project && (
            <span className={styles.memberCount}>
              {project.members.length + 1}명
            </span>
          )}
        </button>

        {openMenu === "members" && (
          <div className={styles.popupMembers}>
            <ProjectMemberMenu projectId={projectId} />
          </div>
        )}
      </div>

      {/* 완료·삭제 확인 (PROJECT_019 — 되돌릴 수 없다) */}
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ""}
        description={confirm?.description}
        confirmLabel={confirm?.label}
        tone={confirm?.tone}
        loading={isChangingStatus}
        onClose={closeConfirm}
        onConfirm={confirmStatus}
      />
    </div>
  );
}
