"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { LuCrown } from "react-icons/lu";

import { getErrorCode } from "@/lib/api/errorCode";
import { cx } from "@/lib/cx";

import Button from "@/components/Button/Button";
import DatePicker from "@/components/DatePicker/DatePicker";
import FormField from "@/components/FormField/FormField";
import SearchBar from "@/components/SearchBar/SearchBar";
import { useToastStore } from "@/stores/useToastStore";

import { useAgentStore } from "@/features/agent/stores/useAgentStore";
import LeaveConfirmModal from "@/features/project/components/modal/LeaveConfirmModal/LeaveConfirmModal";
import { type MilestoneInput } from "@/features/project/create/api/projectApi";
import { useCreateProjectMutation } from "@/features/project/create/hooks/mutations/useCreateProjectMutation";
import { useUpdateProjectMutation } from "@/features/project/create/hooks/mutations/useUpdateProjectMutation";
import { useMilestoneReorder } from "@/features/project/create/hooks/useMilestoneReorder";
import {
  koreanMoney,
  periodLabel,
  withComma,
} from "@/features/project/create/utils/format";
import { useProjectMembersQuery } from "@/features/project/hooks/queries/useProjectMembersQuery";
import { useLeaveGuard } from "@/features/project/hooks/useLeaveGuard";
import type { ProjectDetail } from "@/features/project/overview/api/overviewApi";
import type { UserSearchResult } from "@/features/user/api/userApi";
import {
  DEPARTMENT_LABEL,
  POSITION_LABEL,
  describeAffiliation,
  type StatusType,
} from "@/features/user/constants/organization";
import { useMyProfileQuery } from "@/features/user/hooks/queries/useMyProfileQuery";
import { useUserSearchQuery } from "@/features/user/hooks/queries/useUserSearchQuery";

import styles from "./ProjectForm.module.css";

// 수정이 막히는 이유를 그대로 알려준다 — 화면이 미리 알 수 없는 실패들이다.
const UPDATE_ERROR_MESSAGE: Record<string, string> = {
  PROJECT_002: "참여자 중 찾을 수 없는 사용자가 있어요",
  PROJECT_003: "목표일은 시작일 이후여야 해요",
  PROJECT_004: "프로젝트를 찾을 수 없어요",
  PROJECT_005: "프로젝트 오너와 PM만 수정할 수 있어요",
  PROJECT_015: "마일스톤 목표일이 프로젝트 기간을 벗어났어요",
  PROJECT_016: "마일스톤은 목표일과 내용을 모두 입력해 주세요",
  PROJECT_020: "완료·삭제된 프로젝트는 수정할 수 없어요",
  PROJECT_021:
    "새 기간을 벗어나는 할 일·지출·회의록이 있어 기간을 줄일 수 없어요",
  PROJECT_022: "이미 삭제된 마일스톤이 있어요. 새로고침 후 다시 시도해 주세요",
  REQUEST_001: "입력값을 다시 확인해 주세요",
  REQUEST_029: "다른 사용자가 먼저 수정했어요. 새로고침 후 다시 시도해 주세요",
  USER_003: "퇴사한 사용자가 포함되어 있어요",
};

// 서버 검증(ProjectRequest)과 동일한 상한. 넘기기 전에 화면에서 막는다.
const MAX = {
  name: 100,
  description: 500,
  role: 20,
  milestoneGoal: 200,
  members: 100,
  milestones: 50,
  // 자바스크립트 안전 정수(9천조 대) 안에 두려는 값. 넘기면 표기부터 깨진다.
  budgetDigits: 15,
} as const;

interface MemberRow {
  userId: number;
  name: string;
  team: string;
  position: string;
  status?: StatusType;
  role: string;
}

interface MilestoneRow extends MilestoneInput {
  // 화면에서 행을 구분하는 값. 서버로는 보내지 않는다.
  key: string;
}

interface FormValues {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  budget: string;
  noBudgetLimit: boolean;
  ownerRole: string;
  members: MemberRow[];
  milestones: MilestoneRow[];
}

const EMPTY_VALUES: FormValues = {
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  budget: "",
  noBudgetLimit: false,
  ownerRole: "",
  members: [],
  milestones: [],
};

// 저장하지 않은 변경이 있는지 가리는 데 쓴다. 저장에 실제로 들어가는 값만 한 벌로 묶는다.
const snapshotOf = (values: FormValues) =>
  JSON.stringify([
    values.name,
    values.description,
    values.startDate,
    values.endDate,
    values.noBudgetLimit ? "0" : values.budget,
    values.ownerRole,
    values.members.map((member) => [member.userId, member.role]),
    values.milestones
      .filter((ms) => ms.targetDate || ms.goal)
      .map((ms) => [ms.milestoneId ?? null, ms.targetDate, ms.goal]),
  ]);

export const toFormValues = (detail: ProjectDetail): FormValues => ({
  name: detail.name,
  description: detail.description ?? "",
  startDate: detail.startDate,
  endDate: detail.endDate,
  budget: detail.budget === 0 ? "" : String(detail.budget),
  noBudgetLimit: detail.budget === 0,
  ownerRole: detail.owner.ownerRole ?? "",
  members: detail.members.map((member) => ({
    userId: member.userId,
    name: member.name,
    // 상세 응답에는 부서·직급이 없다. 참여자 조회로 채워 넣는다
    team: "",
    position: "",
    status: member.status,
    role: member.role ?? "",
  })),
  // milestoneId를 그대로 들고 있어야 완료 상태가 보존된다
  milestones: detail.milestones.map((ms) => ({
    key: `ms-${ms.milestoneId}`,
    milestoneId: ms.milestoneId,
    targetDate: ms.targetDate,
    goal: ms.goal,
  })),
});

interface ProjectFormProps {
  // 값이 있으면 수정 모드 (없으면 생성)
  projectId?: string;
  detail?: ProjectDetail;
}

export default function ProjectForm({ projectId, detail }: ProjectFormProps) {
  const isEdit = !!projectId;
  // 마운트 시점의 값만 쓴다 (key로 리마운트되므로 이후 detail 변화는 폼을 건드리지 않는다)
  const [initial] = useState(() =>
    detail ? toFormValues(detail) : EMPTY_VALUES,
  );

  const router = useRouter();

  const openAgent = useAgentStore((state) => state.openAgent);
  const showToast = useToastStore((state) => state.showToast);

  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);
  const [budget, setBudget] = useState(initial.budget);
  const [noBudgetLimit, setNoBudgetLimit] = useState(initial.noBudgetLimit);

  const [ownerRole, setOwnerRole] = useState(initial.ownerRole);
  const [members, setMembers] = useState<MemberRow[]>(initial.members);
  const [memberKeyword, setMemberKeyword] = useState("");

  const [milestones, setMilestones] = useState<MilestoneRow[]>(
    initial.milestones,
  );

  // '변경 없음'의 기준. 마운트 시점의 값이 곧 기준이다.
  const [baseline] = useState(() => snapshotOf(initial));

  const { mutate: createProject, isPending: isCreating } =
    useCreateProjectMutation();
  const { mutate: updateProject, isPending: isUpdating } =
    useUpdateProjectMutation(projectId ?? "");

  // 생성 모드의 오너는 로그인 사용자다
  const { data: me } = useMyProfileQuery();

  const isPending = isCreating || isUpdating;

  // 참여자 검색 — 캘린더 인원 선택과 같은 훅(GET /users/search)
  const { results: suggestions, searching } = useUserSearchQuery(memberKeyword);

  const ownerUserId = detail?.owner.userId ?? me?.userId;
  const ownerName = detail?.owner.name ?? me?.name ?? "";

  // 부서·직급은 상세 응답에 없어 참여자 조회에서 가져온다 (수정 모드에서만).
  // 폼 상태에 섞지 않고 그릴 때만 참고한다 — '수정한 것 없음' 판정이 흔들리지 않도록.
  const { data: projectMembers } = useProjectMembersQuery(
    isEdit ? (projectId ?? "") : "",
  );

  const profileById = useMemo(() => {
    const map = new Map<
      number,
      { team: string; position: string; status: StatusType }
    >();

    projectMembers?.forEach((member) =>
      map.set(member.userId, {
        team: DEPARTMENT_LABEL[member.department],
        position: POSITION_LABEL[member.position],
        status: member.status,
      }),
    );

    return map;
  }, [projectMembers]);

  const isOnLeave = (userId: number, fallback?: MemberRow) =>
    (profileById.get(userId)?.status ?? fallback?.status) === "ON_LEAVE";

  const profileLabel = (userId: number, fallback?: MemberRow) => {
    const profile = profileById.get(userId);
    const team = profile?.team || fallback?.team || "";
    const position = profile?.position || fallback?.position || "";

    return [team, position]
      .filter(Boolean)
      .map((part) => `· ${part}`)
      .join(" ");
  };

  const ownerProfileLabel =
    isEdit || !me
      ? profileLabel(ownerUserId ?? -1)
      : `· ${describeAffiliation(me)}`;

  const selectableSuggestions = useMemo(
    () =>
      suggestions.filter(
        (user) =>
          user.userId !== ownerUserId &&
          !members.some((member) => member.userId === user.userId),
      ),
    [suggestions, ownerUserId, members],
  );

  // 저장하지 않은 변경이 있으면 화면을 벗어나기 전에 한 번 묻는다.
  const isDirty = useMemo(
    () =>
      snapshotOf({
        name,
        description,
        startDate,
        endDate,
        budget,
        noBudgetLimit,
        ownerRole,
        members,
        milestones,
      }) !== baseline,
    [
      name,
      description,
      startDate,
      endDate,
      budget,
      noBudgetLimit,
      ownerRole,
      members,
      milestones,
      baseline,
    ],
  );

  const leaveGuard = useLeaveGuard(isDirty);

  // 시작일을 목표일 뒤로 옮기면 뒤집힌 기간이 서버로 나간다 (PROJECT_003). 그래서 비운다.
  const handleStartDateChange = (next: string) => {
    setStartDate(next);
    if (endDate && next > endDate) setEndDate("");
  };

  // 0은 서버에서 '제한 없음'을 뜻해서, 금액으로 0을 적어 넣으면 의도와 다른 프로젝트가 만들어진다.
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBudget(
      e.target.value
        .replace(/[^\d]/g, "")
        .replace(/^0+/, "")
        .slice(0, MAX.budgetDigits),
    );
  };

  const addMember = (user: UserSearchResult) => {
    setMembers((prev) => {
      if (prev.some((m) => m.userId === user.userId)) return prev;
      if (prev.length >= MAX.members) return prev;

      return [
        ...prev,
        {
          userId: user.userId,
          name: user.name,
          team: DEPARTMENT_LABEL[user.department],
          position: POSITION_LABEL[user.position],
          status: user.status,
          role: "",
        },
      ];
    });
    setMemberKeyword("");
  };

  const removeMember = (userId: number) => {
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
  };

  const changeMemberRole = (userId: number, role: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.userId === userId ? { ...m, role } : m)),
    );
  };

  const addMilestone = () => {
    setMilestones((prev) =>
      prev.length >= MAX.milestones
        ? prev
        : [...prev, { key: crypto.randomUUID(), targetDate: "", goal: "" }],
    );
  };

  const changeMilestone = (key: string, patch: Partial<MilestoneInput>) => {
    setMilestones((prev) =>
      prev.map((ms) => (ms.key === key ? { ...ms, ...patch } : ms)),
    );
  };

  const removeMilestone = (key: string) => {
    setMilestones((prev) => prev.filter((ms) => ms.key !== key));
  };

  const moveMilestone = (from: number, to: number) => {
    setMilestones((prev) => {
      if (from === to || to < 0 || to >= prev.length) return prev;

      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const drag = useMilestoneReorder(moveMilestone);

  const handleSubmit = () => {
    const body = {
      name,
      startDate,
      endDate,
      // 0 = 예산 제한 없음
      budget: noBudgetLimit ? 0 : Number(budget),
      description,
      ownerRole: ownerRole || null,
      members: members.map((m) => ({ userId: m.userId, role: m.role || null })),
      // 수정 시 milestoneId를 함께 보내야 완료 상태가 보존된다.
      // 여기서 빠진 기존 마일스톤은 서버에서 삭제된다.
      milestones: milestones
        .filter((ms) => ms.targetDate && ms.goal)
        .map(({ milestoneId, targetDate, goal }) => ({
          milestoneId: milestoneId ?? null,
          targetDate,
          goal,
        })),
    };

    if (isEdit && detail) {
      updateProject(
        { version: detail.version, body },
        {
          onSuccess: () => {
            showToast("프로젝트가 수정되었습니다");
            router.push(`/projects/${projectId}/overview`);
          },

          // 실패하면 이 화면에 남는다. 입력값을 그대로 두어야 고쳐서 다시 낼 수 있다.
          onError: (error) => {
            const code = getErrorCode(error);
            showToast(
              (code && UPDATE_ERROR_MESSAGE[code]) ||
                "프로젝트를 수정하지 못했어요",
              "danger",
            );
          },
        },
      );
      return;
    }

    createProject(body, {
      onSuccess: (data) =>
        router.push(`/projects/${data.result.projectId}/overview`),
    });
  };

  const canSubmit =
    !!name.trim() &&
    !!startDate &&
    !!endDate &&
    (noBudgetLimit || Number(budget) >= 1) &&
    !isPending;

  return (
    // 수정 화면은 프로젝트 레이아웃 안에 놓인다 — 폭과 여백을 바깥에서 정한다.
    <main className={cx(styles.container, isEdit && styles.embedded)}>
      <div className={styles.pageHead}>
        <div className={styles.pageHeadText}>
          <h2 className={styles.pageTitle}>
            {isEdit ? "프로젝트 수정" : "프로젝트 생성"}
          </h2>
          <button type="button" className={styles.pageSub} onClick={openAgent}>
            AI와 함께 유사 프로젝트 이력을 기반으로 작성할 수 있어요 →
          </button>
        </div>
        <div className={styles.actions}>
          <Button
            type="light"
            buttonStyle="weak"
            size="medium"
            onClick={leaveGuard.requestExit}
          >
            취소
          </Button>
          <Button
            size="medium"
            loading={isPending}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {isEdit ? "수정하기" : "생성하기"}
          </Button>
        </div>
      </div>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>기본 정보</h3>

        <FormField
          label="프로젝트명"
          required
          placeholder="예: 그룹웨어 AI 고도화"
          maxLength={MAX.name}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <FormField
          label="프로젝트 설명"
          placeholder="예: 사내 그룹웨어에 AI 기능을 더하는 프로젝트"
          maxLength={MAX.description}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className={styles.row}>
          <div className={styles.col}>
            <DatePicker
              label="시작일"
              required
              value={startDate}
              onChange={handleStartDateChange}
              placeholder="날짜를 선택하세요"
            />
          </div>
          <div className={styles.col}>
            <DatePicker
              label="목표일"
              required
              value={endDate}
              onChange={setEndDate}
              minDate={startDate || undefined}
              placeholder="날짜를 선택하세요"
            />
          </div>
          <div className={styles.col}>
            <FormField
              label="기간"
              placeholder="시작일·목표일을 선택하세요"
              value={periodLabel(startDate, endDate)}
              readOnly
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.col}>
            <FormField
              label="목표 예산"
              required
              placeholder={noBudgetLimit ? "제한 없음" : ""}
              value={noBudgetLimit || !budget ? "" : `₩ ${withComma(budget)}`}
              onChange={handleBudgetChange}
              readOnly={noBudgetLimit}
            />
          </div>
          <div className={styles.col}>
            <FormField
              label="한글 표기"
              placeholder="목표 예산을 입력하세요"
              value={noBudgetLimit ? "제한 없음" : koreanMoney(budget)}
              readOnly
            />
          </div>
          <button
            type="button"
            className={cx(
              styles.budgetToggle,
              noBudgetLimit && styles.budgetToggleOn,
            )}
            onClick={() => setNoBudgetLimit((v) => !v)}
            aria-pressed={noBudgetLimit}
          >
            예산 제한 없음
          </button>
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>참여자</h3>

        <div className={styles.memberSearch}>
          <SearchBar
            placeholder={
              members.length >= MAX.members
                ? `참여자는 최대 ${MAX.members}명까지 등록할 수 있어요`
                : "이름으로 참여자 추가"
            }
            value={memberKeyword}
            onChange={(e) => setMemberKeyword(e.target.value)}
            disabled={members.length >= MAX.members}
          />
          {memberKeyword.trim() && (
            <ul className={styles.suggest}>
              {selectableSuggestions.length > 0 ? (
                selectableSuggestions.map((user) => (
                  <li key={user.userId}>
                    <button
                      type="button"
                      className={styles.suggestItem}
                      onClick={() => addMember(user)}
                    >
                      <span className={styles.suggestName}>
                        {user.name} · {DEPARTMENT_LABEL[user.department]}
                      </span>

                      {user.status === "ON_LEAVE" && (
                        <span className={styles.suggestLeave}>휴직</span>
                      )}
                    </button>
                  </li>
                ))
              ) : (
                <li className={styles.suggestEmpty}>
                  {searching ? "찾는 중이에요…" : "검색 결과가 없어요"}
                </li>
              )}
            </ul>
          )}
        </div>

        <div className={styles.memberGrid}>
          {/* 오너(생성자) — 제거 불가. 다른 참여자의 ✕ 자리에 왕관을 둔다 */}
          <div className={styles.memberCard}>
            <span className={styles.memberName}>{ownerName}</span>
            <span className={styles.memberTeam}>{ownerProfileLabel}</span>
            {ownerUserId !== undefined && isOnLeave(ownerUserId) && (
              <span className={styles.leave}>휴직</span>
            )}
            <input
              className={styles.roleInput}
              placeholder="역할"
              maxLength={MAX.role}
              value={ownerRole}
              onChange={(e) => setOwnerRole(e.target.value)}
              aria-label={`${ownerName} 역할`}
            />
            <span className={styles.ownerMark} title="프로젝트 책임자">
              <LuCrown aria-label="프로젝트 책임자" />
            </span>
          </div>

          {members.map((member) => (
            <div key={member.userId} className={styles.memberCard}>
              <span className={styles.memberName}>{member.name}</span>
              <span className={styles.memberTeam}>
                {profileLabel(member.userId, member)}
              </span>
              {isOnLeave(member.userId, member) && (
                <span className={styles.leave}>휴직</span>
              )}
              <input
                className={styles.roleInput}
                placeholder="역할"
                maxLength={MAX.role}
                value={member.role}
                onChange={(e) =>
                  changeMemberRole(member.userId, e.target.value)
                }
                aria-label={`${member.name} 역할`}
              />
              <button
                type="button"
                className={styles.memberRemove}
                onClick={() => removeMember(member.userId)}
                aria-label={`${member.name} 참여자 제거`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h3 className={styles.cardTitle}>마일스톤</h3>
          <Button
            size="tiny"
            leftAccessory="+"
            disabled={milestones.length >= MAX.milestones}
            onClick={addMilestone}
          >
            마일스톤 추가
          </Button>
        </div>

        {milestones.length === 0 ? (
          <p className={styles.emptyText}>시기별 목표를 추가해 주세요.</p>
        ) : (
          <>
            <div className={styles.msHead}>
              <span className={styles.msHeadHandle} />
              <span className={styles.msHeadDate}>목표일정</span>
              <span className={styles.msHeadGoal}>목표</span>
              <span className={styles.msHeadAction} />
            </div>

            {milestones.map((ms, index) => (
              <div
                key={ms.key}
                className={cx(
                  styles.msRow,
                  drag.dragIndex === index && styles.msRowDragging,
                  // 놓일 자리를 선으로 표시
                  drag.overIndex === index &&
                    drag.dragIndex !== null &&
                    drag.dragIndex !== index &&
                    (drag.dragIndex < index
                      ? styles.msRowInsertBelow
                      : styles.msRowInsertAbove),
                )}
                draggable={drag.dragKey === ms.key}
                onDragStart={(e) => drag.start(index, e)}
                onDragOver={(e) => drag.over(index, e)}
                onDrop={() => drag.drop(index)}
                onDragEnd={drag.end}
              >
                <span
                  className={styles.msHandle}
                  role="button"
                  tabIndex={0}
                  aria-label={`마일스톤 ${index + 1}번 순서 변경 — 방향키로 이동`}
                  onMouseDown={() => drag.grab(ms.key)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      moveMilestone(index, index - 1);
                    }
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      moveMilestone(index, index + 1);
                    }
                  }}
                />

                <div className={styles.msDate}>
                  <DatePicker
                    value={ms.targetDate}
                    onChange={(date) =>
                      changeMilestone(ms.key, { targetDate: date })
                    }
                    minDate={startDate || undefined}
                    maxDate={endDate || undefined}
                    placeholder="날짜 선택"
                  />
                </div>
                <input
                  className={styles.msGoal}
                  maxLength={MAX.milestoneGoal}
                  value={ms.goal}
                  onChange={(e) =>
                    changeMilestone(ms.key, { goal: e.target.value })
                  }
                  aria-label={`마일스톤 ${index + 1}번 목표`}
                />
                <button
                  type="button"
                  className={styles.msRemove}
                  onClick={() => removeMilestone(ms.key)}
                  aria-label="마일스톤 제거"
                >
                  ✕
                </button>
              </div>
            ))}
          </>
        )}
      </section>

      <LeaveConfirmModal
        open={leaveGuard.confirmOpen}
        description={
          isEdit
            ? "저장하지 않은 수정 내용이 모두 사라지고 기존 프로젝트 정보로 돌아갑니다. 그래도 나가시겠어요?"
            : "입력한 기본 정보·참여자·마일스톤이 모두 사라집니다. 그래도 나가시겠어요?"
        }
        onStay={leaveGuard.stay}
        onLeave={leaveGuard.leave}
      />
    </main>
  );
}
