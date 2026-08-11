// 에이전트가 가리키는 화면(action.targetScreen) ↔ 실제 라우트 매핑.
//
// targetScreen 은 LLM 이 만들어 보내는 문자열이라 여기 없는 값이 올 수 있다.
// 그때는 이동 버튼을 아예 띄우지 않는다 — 없는 경로로 보내는 것보다 안 보내는 쪽이 낫다.

import type { AgentScreenContext } from "@/features/agent/api/agentApi";
import type { SuggestionScreen } from "@/features/agent/types";

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

/**
 * 에이전트가 부르는 다른 이름 → 실제 화면 키.
 *
 * LLM 쪽 navigate 도구는 TASK_LIST·LEAVE_LIST 처럼 여기 표에 없는 이름을 예시로 들고 있다.
 * 그대로 두면 resolveRoute 가 null 을 주고 이동 카드가 아무 말 없이 사라진다 —
 * 같은 화면을 가리키는 이름은 여기서 받아 준다.
 */
export const SCREEN_ALIASES: Record<string, ScreenKey> = {
  PROJECT_DETAIL: "PROJECT_OVERVIEW",
  // 할 일은 따로 화면이 없고 프로젝트 개요 탭에 있다
  TASK_LIST: "PROJECT_OVERVIEW",
  // 휴가·일정은 캘린더 한 화면에서 함께 본다
  LEAVE_LIST: "CALENDAR",
  SCHEDULE_LIST: "CALENDAR",
};

const PARAM = /\[(\w+)\]/g;

/** 별칭까지 풀어 실제 화면 키로. 모르는 이름이면 null */
export function canonicalScreenKey(value?: string): ScreenKey | null {
  if (!value) return null;
  if (value in SCREEN_ROUTES) return value as ScreenKey;

  return SCREEN_ALIASES[value] ?? null;
}

/** 화면 이름. 모르는 화면이면 null */
export function screenLabel(targetScreen?: string): string | null {
  const key = canonicalScreenKey(targetScreen);

  return key ? SCREEN_ROUTES[key].label : null;
}

/**
 * targetScreen + params → 실제 경로.
 * 채울 값이 하나라도 비면 null 을 준다 (`/projects/undefined/board` 로 보내지 않는다).
 */
export function resolveRoute(
  targetScreen?: string,
  params?: Record<string, unknown>,
): string | null {
  const screen = canonicalScreenKey(targetScreen);
  if (!screen) return null;

  const values = params ?? {};
  let missing = false;

  const path = SCREEN_ROUTES[screen].pattern.replace(PARAM, (_, key) => {
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

const PROJECT_PATH = "/projects";

/**
 * 추천 문구 API 에 보낼 화면 이름. 규격에 있는 세 값 중 하나로 접어서 보낸다.
 *
 * 게시판·회의록·재무는 전부 프로젝트 안의 탭이라 PROJECT 로 묶인다 — 화면 키만큼 잘게
 * 나눠 보내면 서버 캐시가 탭마다 갈라지고, 추천 후보는 어차피 같다.
 * 모르는 경로는 HOME 이다. 서버가 못 알아보는 값을 보내는 것보다 기본값이 낫다.
 */
export function suggestionScreen(pathname: string): SuggestionScreen {
  const key = findScreenKey(pathname);
  if (key === "CALENDAR") return "CALENDAR";

  return key && SCREEN_ROUTES[key].pattern.startsWith(PROJECT_PATH)
    ? "PROJECT"
    : "HOME";
}

/**
 * 경로에 박혀 있는 값들 (`/projects/3/meetings/41` → `{ projectId: "3", meetingId: "41" }`).
 *
 * 화면마다 useParams 를 심는 대신 경로 하나로 뽑는다 — 어차피 같은 값이고,
 * 화면이 늘어도 SCREEN_ROUTES 에 pattern 만 적으면 따라온다.
 */
export function extractRouteParams(pathname: string): Record<string, string> {
  const key = findScreenKey(pathname);
  if (!key) return {};

  const { pattern } = SCREEN_ROUTES[key];
  const names = [...pattern.matchAll(PARAM)].map(([, name]) => name);
  if (names.length === 0) return {};

  const matched = new RegExp(`^${pattern.replace(PARAM, "([^/]+)")}$`).exec(
    pathname,
  );
  if (!matched) return {};

  return Object.fromEntries(names.map((name, i) => [name, matched[i + 1]]));
}

// 숫자로 된 경로 값은 숫자로 보낸다 — 에이전트가 projectId 를 그대로 도구 인자로 쓴다.
const asValue = (value: string) => (/^\d+$/.test(value) ? Number(value) : value);

/**
 * 요청에 실어 보낼 화면 문맥.
 *
 * 담기는 것이 formState 에 몰려 있는 이유: 에이전트 쪽 ScreenContext 모델에는
 * screen 과 formState 두 칸밖에 없어, 나머지 키를 위에 달면 받는 쪽에서 버려진다.
 * 반면 formState 는 dict 그대로 통과하고 프롬프트에도 그대로 찍힌다.
 * 경로 값(projectId·taskId)을 formState 에서 읽는 것도 에이전트 쪽 규약이다.
 *
 * screen 키만으로는 "회의록 목록"이라고 답할 수 없다 — 한국어 이름은 이 표에만
 * 있어서 에이전트가 이름을 지어낸다. `_screen` 으로 함께 보내는 이유다.
 */
export function buildScreenContext(
  pathname: string,
  formState?: Record<string, unknown>,
): AgentScreenContext {
  const key = findScreenKey(pathname);
  const label = key ? SCREEN_ROUTES[key].label : "알 수 없는 화면";
  const params = extractRouteParams(pathname);

  const routeValues = Object.fromEntries(
    Object.entries(params).map(([name, value]) => [name, asValue(value)]),
  );

  return {
    screen: key ?? "UNKNOWN",
    // 지금은 받는 쪽 모델에 없어 버려지는 값들이다. 자리를 맞춰 두면 그쪽이 필드를
    // 여는 날 프론트를 고치지 않아도 되고, BE 가 남기는 실행 기록에도 함께 남는다.
    screenLabel: label,
    path: pathname,
    params,
    formState: {
      ...routeValues,
      _screen: label,
      _path: pathname,
      ...formState,
    },
  };
}
