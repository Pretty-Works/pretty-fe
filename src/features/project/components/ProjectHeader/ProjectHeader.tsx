"use client";

import { useRef, useState } from "react";

import { useParams, usePathname, useRouter } from "next/navigation";

import type { Tone } from "@/constants/tone";
import { getErrorCode } from "@/lib/api/errorCode";
import { cx } from "@/lib/cx";

import ConfirmDialog from "@/components/ConfirmDialog/ConfirmDialog";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useToastStore } from "@/stores/useToastStore";

import type { ProjectStatus } from "@/features/project/api/projectListApi";
import { PROJECT_STATUS_META } from "@/features/project/constants/projectStatus";
import { getProjectTabSegment } from "@/features/project/constants/projectTabs";
import { useCanManageProject } from "@/features/project/hooks/useCanManageProject";
import { useRememberLastProject } from "@/features/project/hooks/useRememberLastProject";
import { useChangeProjectStatusMutation } from "@/features/project/overview/hooks/mutations/useChangeProjectStatusMutation";
import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";
import { useLeaveGuardStore } from "@/features/project/stores/useLeaveGuardStore";

import ProjectMemberMenu from "./ProjectMemberMenu";
import ProjectStatusMenu from "./ProjectStatusMenu";
import ProjectSwitchMenu from "./ProjectSwitchMenu";

import styles from "./ProjectHeader.module.css";

type OpenMenu = "status" | "switch" | "members" | null;

// 무엇이 바뀌었는지 문구와 색으로 함께 알린다. 색은 상태 점(ProjectStatusMenu)과 같은 토큰.
const STATUS_TOAST: Record<ProjectStatus, { message: string; tone: Tone }> = {
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

// 되돌릴 수 없는 상태(PROJECT_019)라 고르면 바로 바꾸지 않고 한 번 묻는다.
// 완료는 정상적인 마무리라 보라, 삭제만 빨강으로 무게를 준다.
const CONFIRM_STATUS: Partial<
  Record<
    ProjectStatus,
    {
      title: string;
      description: string;
      label: string;
      tone: "primary" | "danger";
    }
  >
> = {
  COMPLETED: {
    title: "프로젝트를 완료할까요?",
    description:
      "완료한 프로젝트는 다시 진행중으로 되돌릴 수 없어요. 회의록·게시글·할 일도 더 이상 추가할 수 없어요.",
    label: "완료",
    tone: "primary",
  },
  ARCHIVED: {
    title: "프로젝트를 삭제할까요?",
    description:
      "삭제한 프로젝트는 목록에서 사라지고 되돌릴 수 없어요. 안에 쌓인 회의록·지출·할 일도 함께 볼 수 없게 돼요.",
    label: "삭제",
    tone: "danger",
  },
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
  const { mutate: changeStatus, isPending: isChangingStatus } =
    useChangeProjectStatusMutation(projectId);

  // 확인을 기다리는 상태 (완료·삭제)
  const [pendingStatus, setPendingStatus] = useState<ProjectStatus | null>(
    null,
  );

  // 수정(PROJECT_005)과 상태 변경(PROJECT_017)의 판정 기준이 같다 — 오너이거나 부서가 PM
  const canManage = useCanManageProject(projectId);

  // 프로젝트 수정처럼 작성 중인 화면에서 다른 프로젝트로 넘어가려 하면 먼저 확인을 받는다
  const requestLeave = useLeaveGuardStore((state) => state.requestLeave);

  // 상단바 '프로젝트'가 이 프로젝트의 개요로 되돌아온다. 이 컴포넌트가 네 탭 모두에 있다.
  useRememberLastProject(projectId, {
    ready: !!project,
    unavailable: isError,
  });

  // 보관은 갈 수 있는 상태가 없고, 완료는 삭제만 남는다 (PROJECT_019).
  // 바꿀 수 있는 사람은 오너·PM뿐이다 (PROJECT_017 = ProjectPolicy.canUpdate).
  const canChangeStatus =
    !!project && project.status !== "ARCHIVED" && canManage;

  useClickOutside(rootRef, () => setOpenMenu(null), openMenu !== null);

  const toggle = (menu: OpenMenu) =>
    setOpenMenu((prev) => (prev === menu ? null : menu));

  const applyStatus = (status: ProjectStatus) => {
    changeStatus(status, {
      onSuccess: () => {
        setOpenMenu(null);
        setPendingStatus(null);

        const { message, tone } = STATUS_TOAST[status];
        showToast(message, tone);

        // 삭제(보관)는 이 화면에 남아 있을 수 없어 홈으로 내보낸다.
        // 토스트는 layout에 있어 이동해도 그대로 떠 있다.
        if (status === "ARCHIVED") router.push("/");
      },

      onError: (error) => {
        setOpenMenu(null);
        setPendingStatus(null);

        const code = getErrorCode(error);
        showToast(
          (code && STATUS_ERROR_MESSAGE[code]) ||
            "프로젝트 상태를 변경하지 못했어요",
          "danger",
        );
      },
    });
  };

  // 되돌릴 수 없는 상태는 바로 바꾸지 않고 확인을 먼저 받는다
  const selectStatus = (status: ProjectStatus) => {
    if (!CONFIRM_STATUS[status]) {
      applyStatus(status);
      return;
    }

    setOpenMenu(null);
    setPendingStatus(status);
  };

  const confirm = pendingStatus ? CONFIRM_STATUS[pendingStatus] : undefined;

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
              onChange={selectStatus}
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
        onClose={() => setPendingStatus(null)}
        onConfirm={() => pendingStatus && applyStatus(pendingStatus)}
      />
    </div>
  );
}
