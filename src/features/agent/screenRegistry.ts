// 에이전트가 가리키는 화면(action.targetScreen) ↔ 실제 라우트 매핑.
//
// targetScreen 은 LLM 이 만들어 보내는 문자열이라 여기 없는 값이 올 수 있다.
// 그때는 이동 버튼을 아예 띄우지 않는다 — 없는 경로로 보내는 것보다 안 보내는 쪽이 낫다.

import type { AgentScreenContext } from "@/features/agent/api/agentApi";

export interface ScreenRoute {
  /** 이동 카드에 보여줄 화면 이름 */
  label: string;
  /** [projectId] 같은 자리는 action.params 값으로 채운다 */
  pattern: string;
}

export const SCREEN_ROUTES = {
  HOME: { label: "홈", pattern: "/" },
  CALENDAR: { label: "캘린더", pattern: "/calendar" },

  PROJECT_CREATE: { label: "프로젝트 생성", pattern: "/projects/new" },
  PROJECT_OVERVIEW: {
    label: "프로젝트 개요",
    pattern: "/projects/[projectId]/overview",
  },
  PROJECT_EDIT: {
    label: "프로젝트 수정",
    pattern: "/projects/[projectId]/edit",
  },

  BOARD_LIST: { label: "게시판", pattern: "/projects/[projectId]/board" },
  BOARD_CREATE: {
    label: "게시글 작성",
    pattern: "/projects/[projectId]/board/write",
  },
  BOARD_DETAIL: {
    label: "게시글 상세",
    pattern: "/projects/[projectId]/board/[postId]",
  },

  MEETING_LIST: { label: "회의록", pattern: "/projects/[projectId]/meetings" },
  MEETING_CREATE: {
    label: "회의록 작성",
    pattern: "/projects/[projectId]/meetings/write",
  },
  MEETING_DETAIL: {
    label: "회의록 상세",
    pattern: "/projects/[projectId]/meetings/[meetingId]",
  },

  FINANCE: { label: "재무", pattern: "/projects/[projectId]/finance" },
} as const satisfies Record<string, ScreenRoute>;

export type ScreenKey = keyof typeof SCREEN_ROUTES;

const PARAM = /\[(\w+)\]/g;

const isKnownScreen = (value?: string): value is ScreenKey =>
  !!value && value in SCREEN_ROUTES;

/** 화면 이름. 모르는 화면이면 null */
export function screenLabel(targetScreen?: string): string | null {
  return isKnownScreen(targetScreen) ? SCREEN_ROUTES[targetScreen].label : null;
}

/**
 * targetScreen + params → 실제 경로.
 * 채울 값이 하나라도 비면 null 을 준다 (`/projects/undefined/board` 로 보내지 않는다).
 */
export function resolveRoute(
  targetScreen?: string,
  params?: Record<string, unknown>,
): string | null {
  if (!isKnownScreen(targetScreen)) return null;

  const values = params ?? {};
  let missing = false;

  const path = SCREEN_ROUTES[targetScreen].pattern.replace(PARAM, (_, key) => {
    const value = values[key];
    if (value === undefined || value === null || value === "") {
      missing = true;
      return "";
    }
    return String(value);
  });

  return missing ? null : path;
}

/** 지금 보고 있는 경로가 어느 화면인지. 에이전트에 넘길 screenContext.screen 이자, */
export function findScreenKey(pathname: string): ScreenKey | null {
  const keys = (Object.keys(SCREEN_ROUTES) as ScreenKey[]).sort(
    (a, b) =>
      (SCREEN_ROUTES[a].pattern.match(PARAM)?.length ?? 0) -
      (SCREEN_ROUTES[b].pattern.match(PARAM)?.length ?? 0),
  );

  return (
    keys.find((key) => {
      const source = SCREEN_ROUTES[key].pattern.replace(PARAM, "[^/]+");
      return new RegExp(`^${source}$`).test(pathname);
    }) ?? null
  );
}

/** 요청에 실어 보낼 화면 문맥. 기본은 `{ screen }` 하나뿐이다. */
export function buildScreenContext(
  pathname: string,
  extra?: Record<string, unknown>,
): AgentScreenContext {
  return {
    screen: findScreenKey(pathname) ?? "UNKNOWN",
    ...extra,
  };
}
