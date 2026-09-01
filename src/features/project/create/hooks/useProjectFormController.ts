"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { getErrorCode } from "@/lib/api/errorCode";
import { useToastStore } from "@/stores/useToastStore";

import { useAgentFormFill } from "@/features/agent/hooks/useAgentFormFill";
import { useScreenFormState } from "@/features/agent/hooks/useScreenFormState";
import { useAgentStore } from "@/features/agent/stores/useAgentStore";
import type { MilestoneInput } from "@/features/project/create/api/projectApi";
import { useCreateProjectMutation } from "@/features/project/create/hooks/mutations/useCreateProjectMutation";
import { useUpdateProjectMutation } from "@/features/project/create/hooks/mutations/useUpdateProjectMutation";
import { useMilestoneReorder } from "@/features/project/create/hooks/useMilestoneReorder";
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

export const PROJECT_FORM_LIMITS = {
  name: 100,
  description: 500,
  role: 20,
  milestoneGoal: 200,
  members: 100,
  milestones: 50,
  budgetDigits: 15,
} as const;

export interface ProjectFormMember {
  userId: number;
  name: string;
  team: string;
  position: string;
  status?: StatusType;
  role: string;
}

export interface ProjectFormMilestone extends MilestoneInput {
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
  members: ProjectFormMember[];
  milestones: ProjectFormMilestone[];
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
      .filter((milestone) => milestone.targetDate || milestone.goal)
      .map((milestone) => [
        milestone.milestoneId ?? null,
        milestone.targetDate,
        milestone.goal,
      ]),
  ]);

export const toProjectFormValues = (detail: ProjectDetail): FormValues => ({
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
    team: "",
    position: "",
    status: member.status,
    role: member.role ?? "",
  })),
  milestones: detail.milestones.map((milestone) => ({
    key: `ms-${milestone.milestoneId}`,
    milestoneId: milestone.milestoneId,
    targetDate: milestone.targetDate,
    goal: milestone.goal,
  })),
});

export interface ProjectFormControllerOptions {
  projectId?: string;
  detail?: ProjectDetail;
}

export function useProjectFormController({
  projectId,
  detail,
}: ProjectFormControllerOptions) {
  const isEdit = !!projectId;
  const [initial] = useState(() =>
    detail ? toProjectFormValues(detail) : EMPTY_VALUES,
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
  const [members, setMembers] = useState<ProjectFormMember[]>(initial.members);
  const [memberKeyword, setMemberKeyword] = useState("");
  const [milestones, setMilestones] = useState<ProjectFormMilestone[]>(
    initial.milestones,
  );
  const [baseline] = useState(() => snapshotOf(initial));

  const { mutate: createProject, isPending: isCreating } =
    useCreateProjectMutation();
  const { mutate: updateProject, isPending: isUpdating } =
    useUpdateProjectMutation(projectId ?? "");
  const { data: me } = useMyProfileQuery();
  const { results: suggestions, searching } = useUserSearchQuery(memberKeyword);
  const ownerUserId = detail?.owner.userId ?? me?.userId;
  const ownerName = detail?.owner.name ?? me?.name ?? "";
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

  const isOnLeave = (userId: number, fallback?: ProjectFormMember) =>
    (profileById.get(userId)?.status ?? fallback?.status) === "ON_LEAVE";
  const profileLabel = (userId: number, fallback?: ProjectFormMember) => {
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

  const changeStartDate = (next: string) => {
    setStartDate(next);
    if (endDate && next > endDate) setEndDate("");
  };
  const changeBudget = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBudget(
      event.target.value
        .replace(/[^\d]/g, "")
        .replace(/^0+/, "")
        .slice(0, PROJECT_FORM_LIMITS.budgetDigits),
    );
  };
  const addMember = (user: UserSearchResult) => {
    setMembers((previous) => {
      if (previous.some((member) => member.userId === user.userId))
        return previous;
      if (previous.length >= PROJECT_FORM_LIMITS.members) return previous;
      return [
        ...previous,
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
    setMembers((previous) =>
      previous.filter((member) => member.userId !== userId),
    );
  };
  const changeMemberRole = (userId: number, role: string) => {
    setMembers((previous) =>
      previous.map((member) =>
        member.userId === userId ? { ...member, role } : member,
      ),
    );
  };
  const addMilestone = () => {
    setMilestones((previous) =>
      previous.length >= PROJECT_FORM_LIMITS.milestones
        ? previous
        : [
            ...previous,
            { key: crypto.randomUUID(), targetDate: "", goal: "" },
          ],
    );
  };
  const changeMilestone = (
    key: string,
    patch: Partial<MilestoneInput>,
  ) => {
    setMilestones((previous) =>
      previous.map((milestone) =>
        milestone.key === key ? { ...milestone, ...patch } : milestone,
      ),
    );
  };
  const removeMilestone = (key: string) => {
    setMilestones((previous) =>
      previous.filter((milestone) => milestone.key !== key),
    );
  };
  const moveMilestone = (from: number, to: number) => {
    setMilestones((previous) => {
      if (from === to || to < 0 || to >= previous.length) return previous;
      const next = [...previous];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };
  const drag = useMilestoneReorder(moveMilestone);

  useScreenFormState({
    mode: isEdit ? "edit" : "create",
    name,
    description,
    startDate,
    endDate,
    budget: noBudgetLimit ? 0 : Number(budget) || null,
    noBudgetLimit,
    ownerRole,
    members: members.map((member) => ({
      userId: member.userId,
      name: member.name,
      role: member.role || null,
    })),
    milestones: milestones
      .filter((milestone) => milestone.targetDate || milestone.goal)
      .map(({ targetDate, goal }) => ({ targetDate, goal })),
  });

  const applyFill = (formData: Record<string, unknown>) => {
    const text = (value: unknown, max: number) =>
      typeof value === "string" && value.trim() ? value.slice(0, max) : null;
    const day = (value: unknown) =>
      typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? value
        : null;
    const filled: string[] = [];
    const nextName = text(formData.name, PROJECT_FORM_LIMITS.name);
    if (nextName) {
      setName(nextName);
      filled.push("프로젝트명");
    }
    const nextDescription = text(
      formData.description,
      PROJECT_FORM_LIMITS.description,
    );
    if (nextDescription) {
      setDescription(nextDescription);
      filled.push("설명");
    }
    const nextStart = day(formData.startDate);
    const nextEnd = day(formData.endDate);
    if (nextStart && (!nextEnd || nextStart <= nextEnd)) {
      setStartDate(nextStart);
      filled.push("시작일");
    }
    if (nextEnd && (!nextStart || nextStart <= nextEnd)) {
      setEndDate(nextEnd);
      filled.push("목표일");
    }
    if (typeof formData.budget === "number" && formData.budget >= 0) {
      setNoBudgetLimit(formData.budget === 0);
      setBudget(
        formData.budget === 0
          ? ""
          : String(Math.floor(formData.budget)).slice(
              0,
              PROJECT_FORM_LIMITS.budgetDigits,
            ),
      );
      filled.push("목표 예산");
    }
    const nextOwnerRole = text(
      formData.ownerRole,
      PROJECT_FORM_LIMITS.role,
    );
    if (nextOwnerRole) {
      setOwnerRole(nextOwnerRole);
      filled.push("내 역할");
    }

    const namedMembers = Array.isArray(formData.members)
      ? formData.members
          .filter(
            (row): row is { userId: number; name: string; role?: unknown } =>
              !!row &&
              typeof row === "object" &&
              typeof (row as { userId?: unknown }).userId === "number" &&
              typeof (row as { name?: unknown }).name === "string" &&
              !!(row as { name: string }).name.trim(),
          )
          .filter((row) => row.userId !== ownerUserId)
          .slice(0, PROJECT_FORM_LIMITS.members)
      : [];
    const skippedMembers =
      Array.isArray(formData.members) &&
      formData.members.length > namedMembers.length;
    if (namedMembers.length > 0) {
      setMembers(
        namedMembers.map((row) => ({
          userId: row.userId,
          name: row.name,
          team: "",
          position: "",
          role: text(row.role, PROJECT_FORM_LIMITS.role) ?? "",
        })),
      );
      filled.push("참여자");
    }

    const nextMilestones = Array.isArray(formData.milestones)
      ? formData.milestones
          .map((row) => {
            const item = (row ?? {}) as Record<string, unknown>;
            const targetDate = day(item.targetDate);
            const goal = text(item.goal, PROJECT_FORM_LIMITS.milestoneGoal);
            return targetDate && goal
              ? { key: crypto.randomUUID(), targetDate, goal }
              : null;
          })
          .filter((row): row is ProjectFormMilestone => row !== null)
          .slice(0, PROJECT_FORM_LIMITS.milestones)
      : [];
    if (nextMilestones.length > 0) {
      setMilestones(nextMilestones);
      filled.push("마일스톤");
    }
    if (filled.length === 0) {
      showToast("채울 수 있는 내용을 찾지 못했어요", "danger");
      return;
    }
    showToast(
      skippedMembers
        ? `${filled.join(" · ")}을(를) 채웠어요. 참여자는 직접 골라 주세요.`
        : `${filled.join(" · ")}을(를) 채웠어요. 확인 후 저장해 주세요.`,
    );
  };

  useAgentFormFill(isEdit ? "PROJECT_EDIT" : "PROJECT_CREATE", applyFill);

  const submit = () => {
    const body = {
      name,
      startDate,
      endDate,
      budget: noBudgetLimit ? 0 : Number(budget),
      description,
      ownerRole: ownerRole || null,
      members: members.map((member) => ({
        userId: member.userId,
        role: member.role || null,
      })),
      milestones: milestones
        .filter((milestone) => milestone.targetDate && milestone.goal)
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

  const isPending = isCreating || isUpdating;
  return {
    limits: PROJECT_FORM_LIMITS,
    isEdit,
    name,
    setName,
    description,
    setDescription,
    startDate,
    changeStartDate,
    endDate,
    setEndDate,
    budget,
    changeBudget,
    noBudgetLimit,
    setNoBudgetLimit,
    ownerRole,
    setOwnerRole,
    members,
    memberKeyword,
    setMemberKeyword,
    milestones,
    searching,
    selectableSuggestions,
    ownerUserId,
    ownerName,
    ownerProfileLabel,
    isOnLeave,
    profileLabel,
    addMember,
    removeMember,
    changeMemberRole,
    addMilestone,
    changeMilestone,
    removeMilestone,
    moveMilestone,
    drag,
    leaveGuard,
    openAgent,
    submit,
    isPending,
    canSubmit:
      !!name.trim() &&
      !!startDate &&
      !!endDate &&
      (noBudgetLimit || Number(budget) >= 1) &&
      !isPending,
  };
}
