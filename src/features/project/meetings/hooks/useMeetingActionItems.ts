"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getErrorCode } from "@/lib/api/errorCode";

import { useToastStore } from "@/stores/useToastStore";

import { useProjectMembersQuery } from "@/features/project/hooks/queries/useProjectMembersQuery";
import { useCanManageProject } from "@/features/project/hooks/useCanManageProject";
import {
  actionItemKey,
  buildMockActionItems,
} from "@/features/project/meetings/constants/actionItems";
import {
  meetingActionKey,
  selectMeetingActionRecord,
  useMeetingActionStore,
} from "@/features/project/meetings/stores/useMeetingActionStore";
import type { MeetingActionItem } from "@/features/project/meetings/types";
import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";
import { useCreateTaskMutation } from "@/features/task/hooks/mutations/useCreateTaskMutation";

// 에이전트가 회의록을 훑는 시간. 누르자마자 표가 나오면 아무 일도 없던 것처럼 보인다.
// 실행 항목을 내려주는 API가 생기면 이 지연 대신 그 호출이 들어간다.
const GENERATE_MS = 900;

// 서버 검증과 같은 상한 (content 100자)
const MAX_CONTENT = 100;

// 화면이 미리 막지 못하는 실패만 문구로 옮긴다.
const ERROR_MESSAGE: Record<string, string> = {
  TASK_007: "완료 목표일이 프로젝트 기간을 벗어났어요.",
  TASK_008: "다른 사람에게 배정하려면 프로젝트 오너나 PM이어야 해요.",
  TASK_009: "담당자가 이 프로젝트의 참여자가 아니에요.",
  PROJECT_004: "프로젝트를 찾을 수 없어요.",
  PROJECT_020: "완료·삭제된 프로젝트에는 할 일을 둘 수 없어요.",
  MEMBER_001: "이 프로젝트에 참여 중일 때만 할 일을 만들 수 있어요.",
  USER_003: "퇴사한 사용자에게는 할 일을 배정할 수 없어요.",
  REQUEST_001: "입력값을 다시 확인해 주세요.",
};

/** 줄 하나가 지금 어떤 상태인가 — 버튼 문구와 누를 때 벌어지는 일이 여기서 갈린다 */
export interface ActionItemAddState {
  added: boolean;
  pending: boolean;
  /**
   * 바로 등록할 수 없는 이유. 있으면 누를 때 팝업이 열려 이 값을 채우게 한다.
   *
   * 막지 않는 이유: 에이전트가 회의록에 근거가 없는 값을 비워 두는 것은 정상이고,
   * 그 줄이 곧 사용자가 손봐야 하는 줄이다. 눌리지 않게 두면 화면에서 할 수 있는 일이
   * 사라져 사용자는 할 일 탭으로 가서 처음부터 다시 적어야 한다.
   */
  needsInput?: string;
}

interface UseMeetingActionItemsParams {
  projectId: string;
  meetingId: string;
  /** 완료·보관 프로젝트에는 할 일을 둘 수 없다. false면 등록 칸을 감춘다 */
  canAddTask: boolean;
}

/**
 * 회의록 실행 항목 — 뽑아내기 · 바로 등록 · 등록 이력.
 *
 * ★ 카드를 띄울지 말지가 먼저다(visible). 이 카드가 하는 일은 회의에서 나온 할 일을
 *   담당자에게 배정하는 것 하나뿐이라, 배정할 수 없는 사람에게는 보여 줄 이유가 없다.
 *   줄마다 막으면 "보이는데 눌리지 않는" 표가 남아, 무엇을 할 수 있는 화면인지 흐려진다.
 *   기준은 프로젝트 수정 권한과 같다 — 오너이거나 부서가 PM (BE ProjectPolicy.canUpdate).
 *
 * 등록은 팝업 없이 이 자리에서 끝낸다. 실행 항목에는 할 일이 필요로 하는 값(내용·담당자·마감일)이
 * 이미 다 들어 있어, 팝업은 같은 값을 한 번 더 보여 주고 확인만 받는 단계였다.
 * 대신 서버가 거절할 조건은 누르기 전에 미리 판정해 이유를 줄에 적는다 —
 * 확인 단계를 없앤 만큼, 눌러 놓고 실패하는 일이 없어야 한다.
 */
export const useMeetingActionItems = ({
  projectId,
  meetingId,
  canAddTask,
}: UseMeetingActionItemsParams) => {
  const showToast = useToastStore((state) => state.showToast);

  const storeKey = meetingActionKey(projectId, meetingId);
  const record = useMeetingActionStore(selectMeetingActionRecord(storeKey));
  const saveItems = useMeetingActionStore((state) => state.saveItems);
  const markAdded = useMeetingActionStore((state) => state.markAdded);

  const [generating, setGenerating] = useState(false);
  // 지금 등록 중인 줄. 여러 줄을 동시에 누를 수 있으므로 키 집합으로 둔다
  const [pendingKeys, setPendingKeys] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  // 빠진 값을 채우려고 팝업을 연 줄. 팝업의 초기값이 된다
  const [draftItem, setDraftItem] = useState<MeetingActionItem | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 표가 열리기 전에 화면을 떠나면 타이머만 남는다
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const { mutate: createTask } = useCreateTaskMutation();
  const { data: project } = useProjectDetailQuery(projectId);
  const { data: members } = useProjectMembersQuery(projectId);

  // 이 카드 전체의 출입증. 남에게 배정할 수 있어야 회의록 실행 항목이 의미를 갖는다.
  // 아직 모르는 동안(프로필·프로젝트 로딩)은 false라 카드가 잠시 뒤에 나타난다 —
  // 먼저 띄웠다가 감추는 것보다 낫다.
  const visible = useCanManageProject(projectId);

  const items = record.items;
  const generated = record.generated;

  const generate = useCallback(() => {
    if (generating) return;

    setGenerating(true);
    timer.current = setTimeout(() => {
      // 실행 항목 조회 API가 생기면 이 자리에서 응답을 그대로 넣는다
      saveItems(
        storeKey,
        buildMockActionItems(
          members ?? [],
          project
            ? { startDate: project.startDate, targetDate: project.endDate }
            : undefined,
        ),
      );
      setGenerating(false);
    }, GENERATE_MS);
  }, [generating, members, project, saveItems, storeKey]);

  /** 이 줄을 지금 등록할 수 있는가. 누르기 전에 서버가 거절할 조건을 미리 본다 */
  const addStateOf = useCallback(
    (item: MeetingActionItem): ActionItemAddState => {
      const key = actionItemKey(item);
      const added = record.addedKeys.includes(key);
      const pending = pendingKeys.has(key);

      if (added || pending) return { added, pending };

      // 에이전트는 회의록에 근거가 없으면 목표일을 비운다. 어디서든 한 번은 사람이 정해야 하는 값이다
      if (!item.dueDate) {
        return { added, pending, needsInput: "완료 목표일을 정해 주세요" };
      }

      if (
        project &&
        (item.dueDate < project.startDate || item.dueDate > project.endDate)
      ) {
        return {
          added,
          pending,
          needsInput: "완료 목표일이 프로젝트 기간을 벗어나요",
        };
      }

      // 배정 권한은 카드 진입에서 이미 봤다. 여기서는 '그 사람에게 배정할 수 있는가'만 본다 —
      // 참여자가 아닌 사람에게 배정하면 그는 볼 수도 없는 할 일을 받는다 (TASK_009).
      if (
        item.assigneeId !== null &&
        members &&
        !members.some((member) => member.userId === item.assigneeId)
      ) {
        return {
          added,
          pending,
          needsInput: "담당자가 이 프로젝트의 참여자가 아니에요",
        };
      }

      return { added, pending };
    },
    [members, pendingKeys, project, record.addedKeys],
  );

  const addTask = useCallback(
    (item: MeetingActionItem) => {
      const key = actionItemKey(item);
      const state = addStateOf(item);

      if (state.added || state.pending) return;

      // 빠진 값이 있으면 여기서 끝내지 않고 팝업으로 넘긴다. 아는 값은 미리 채워
      // 사용자가 손댈 칸만 남긴다
      if (state.needsInput) {
        setDraftItem(item);
        return;
      }
      // needsInput 이 없으면 목표일은 반드시 있다. 타입을 좁히려고 한 번 더 본다
      if (!item.dueDate) return;

      setPendingKeys((prev) => new Set(prev).add(key));

      const settle = () =>
        setPendingKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });

      createTask(
        {
          content: item.action.slice(0, MAX_CONTENT),
          projectId: Number(projectId),
          dueDate: item.dueDate,
          // 비우면 서버가 등록한 사람을 담당자로 잡는다 (BE resolveAssignee)
          assigneeId: item.assigneeId ?? undefined,
        },
        {
          onSuccess: () => {
            settle();
            markAdded(storeKey, key);
            showToast(
              item.assigneeName
                ? `${item.assigneeName}님의 할 일로 등록했어요.`
                : "할 일로 등록했어요.",
            );
          },
          onError: (error) => {
            settle();
            const code = getErrorCode(error);
            showToast(
              (code && ERROR_MESSAGE[code]) ||
                "할 일을 등록하지 못했어요. 다시 시도해 주세요.",
              "danger",
            );
          },
        },
      );
    },
    [addStateOf, createTask, markAdded, projectId, showToast, storeKey],
  );

  /**
   * 팝업에 넘길 초기값. 그대로 쓸 수 없는 값은 넘기지 않는다 —
   * 채우라고 연 팝업이 못 쓰는 값을 들고 시작하면 사용자가 무엇을 고쳐야 하는지 알 수 없다.
   */
  const draft = draftItem
    ? {
        content: draftItem.action,
        // 기간 밖 날짜는 팝업이 알아서 비운다(dueDateInRange). 여기서 미리 지우면
        // 사용자는 에이전트가 무슨 날짜를 제안했는지 볼 기회를 잃는다
        dueDate: draftItem.dueDate ?? undefined,
        // 참여자로 확인된 담당자만 채운다. 아니면 비워 두고 고르게 한다 (TASK_009)
        assigneeId:
          draftItem.assigneeId !== null &&
          members?.some((member) => member.userId === draftItem.assigneeId)
            ? draftItem.assigneeId
            : undefined,
      }
    : undefined;

  return {
    visible,
    items,
    generated,
    generating,
    generate,
    addStateOf,
    // 프로젝트가 닫혀 있으면 등록 칸을 뺀다 — 눌러 봐야 PROJECT_020으로 막힌다
    onAddTask: canAddTask ? addTask : undefined,

    // 빠진 값을 채우는 팝업
    draftItem,
    draft,
    closeDraft: () => setDraftItem(null),
    // 팝업에서 저장에 성공했을 때. 목표일을 사용자가 바꿨어도 그 실행 항목은 등록된 것이다
    completeDraft: () => {
      if (draftItem) markAdded(storeKey, actionItemKey(draftItem));
    },
  };
};
