"use client";

import { useEffect, useRef, useState } from "react";

import { useParams, usePathname, useRouter } from "next/navigation";

import { getErrorCode } from "@/lib/api/errorCode";
import { useLeaveGuardStore } from "@/stores/useLeaveGuardStore";
import { useToastStore, type ToastTone } from "@/stores/useToastStore";
import { useCanManageProject } from "@/features/project/hooks/useCanManageProject";
import { useRememberLastProject } from "@/features/project/hooks/useRememberLastProject";
import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";
import { useChangeProjectStatusMutation } from "@/features/project/overview/hooks/mutations/useChangeProjectStatusMutation";
import { getProjectTabSegment } from "@/features/project/constants/projectTabs";
import { PROJECT_STATUS_META } from "@/features/home/constants/projectStatus";

import type { ProjectStatus } from "@/features/home/api/homeApi";

import ProjectStatusMenu from "./ProjectStatusMenu";
import ProjectSwitchMenu from "./ProjectSwitchMenu";

import styles from "./ProjectHeader.module.css";

type OpenMenu = "status" | "switch" | null;

// 무엇이 바뀌었는지 문구와 색으로 함께 알린다. 색은 상태 점(ProjectStatusMenu)과 같은 토큰.
const STATUS_TOAST: Record<ProjectStatus, { message: string; tone: ToastTone }> =
  {
    ONGOING: { message: "프로젝트가 다시 진행되었습니다", tone: "green" },
    HOLDING: { message: "프로젝트가 보류되었습니다", tone: "orange" },
    DROPPED: { message: "프로젝트가 중단되었습니다", tone: "gray" },
    COMPLETED: { message: "프로젝트가 완료되었습니다", tone: "purple" },
    ARCHIVED: { message: "프로젝트가 삭제되었습니다", tone: "danger" },
  };

// 상태 변경이 막히는 이유를 그대로 알려준다 — 실패가 조용히 지나가면 버튼이 고장 난 것처럼 보인다.
const STATUS_ERROR_MESSAGE: Record<string, string> = {
  PROJECT_004: "프로젝트를 찾을 수 없어요",
  PROJECT_017: "프로젝트 오너와 PM만 상태를 바꿀 수 있어요",
  PROJECT_018: "알 수 없는 상태예요",
  PROJECT_019: "완료·삭제된 프로젝트는 되돌릴 수 없어요",
  USER_003: "퇴사한 사용자는 상태를 바꿀 수 없어요",
};

export default function ProjectHeader() {
  // 프로젝트 하위 모든 화면에서 쓰이므로 경로에서 직접 id를 읽는다.
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId ?? "";

  const router = useRouter();
  const pathname = usePathname();
  const showToast = useToastStore((state) => state.showToast);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // 프로젝트를 바꿔도 보던 탭에 그대로 남는다 (재무 → 재무, 회의록 → 회의록).
  // 회의록 작성 같은 하위 경로는 탭 첫 화면으로 돌아간다.
  const currentTab = getProjectTabSegment(pathname);

  // 개요 화면과 같은 쿼리 키라 캐시를 공유한다 (요청이 두 번 나가지 않음).
  const { data: project, isError } = useProjectDetailQuery(projectId);
  const { mutate: changeStatus } = useChangeProjectStatusMutation(projectId);

  // 수정(PROJECT_005)과 상태 변경(PROJECT_017)의 판정 기준이 같다 — 오너이거나 역할이 PM
  const canManage = useCanManageProject(projectId);

  // 프로젝트 수정처럼 작성 중인 화면에서 다른 프로젝트로 넘어가려 하면 먼저 확인을 받는다
  const requestLeave = useLeaveGuardStore((state) => state.requestLeave);

  // 상단바 '프로젝트'가 여기로 되돌아온다. 이 컴포넌트가 네 탭 모두에 있어 탭을 옮길 때마다 갱신된다.
  useRememberLastProject(projectId, currentTab, {
    ready: !!project,
    unavailable: isError,
  });

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
  const statusTone =
    project && project.status !== "ARCHIVED"
      ? PROJECT_STATUS_META[project.status].tone
      : null;

  return (
    <div className={styles.header}>
      <div className={styles.selector} ref={rootRef}>
        {/* 색 점 — 진행 상태 변경 */}
        <button
          type="button"
          className={styles.dotButton}
          onClick={() => toggle("status")}
          /* 완료·보관은 되돌릴 수 없고(PROJECT_019), 오너·PM이 아니면 바꿀 수 없다(PROJECT_017) */
          disabled={!isOpenForContent || !canManage}
          aria-haspopup="menu"
          aria-expanded={openMenu === "status"}
          aria-label="프로젝트 상태 변경"
        >
          <span
            className={`${styles.dot} ${statusTone ? styles[statusTone] : ""}`}
          />
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
          <span
            className={`${styles.name} ${!project ? styles.namePlaceholder : ""}`}
          >
            {project?.name ?? (isError ? "열 수 없는 프로젝트" : "불러오는 중…")}
          </span>

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

                    const { message, tone } = STATUS_TOAST[status];
                    showToast(message, tone);

                    // 삭제(보관)는 이 화면에 남아 있을 수 없어 홈으로 내보낸다.
                    // 토스트는 layout에 있어 이동해도 그대로 떠 있다.
                    if (status === "ARCHIVED") router.push("/");
                  },

                  onError: (error) => {
                    setOpenMenu(null);
                    const code = getErrorCode(error);
                    showToast(
                      (code && STATUS_ERROR_MESSAGE[code]) ||
                        "프로젝트 상태를 변경하지 못했어요",
                      "danger",
                    );
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

                const href = `/projects/${nextId}/${currentTab}`;
                if (!requestLeave(href)) router.push(href);
              }}
            />
          </div>
        )}
      </div>

    </div>
  );
}
