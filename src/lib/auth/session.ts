import { LOGIN_PATH } from "@/constants/routes";

import { AUTH_STORAGE_KEY, useAuthStore } from "@/stores/useAuthStore";

import { abortRunStream } from "@/features/agent/api/activeRunStream";
import { useChatStore } from "@/features/agent/stores/useChatStore";
import { useLastProjectStore } from "@/features/project/stores/useLastProjectStore";

import { clearQueryCache } from "../api/queryCache";
import { decodeUserId } from "./token";

// 로그인 뒤에는 언제나 홈에서 시작한다 (LoginView 와 같은 규칙)
const HOME_PATH = "/";

/**
 * 이 탭에 남은 이전 사용자의 흔적을 전부 지운다.
 *
 * 로그아웃은 소프트 이동이라 문서가 살아 있다 — 토큰만 버리면 응답 캐시도, 모듈에 남는
 * 스토어도, 열려 있는 스트림도 다음 사용자에게 그대로 넘어간다. 세션이 끝나는 자리는
 * (로그아웃·세션 만료) 전부 이 함수 하나를 부른다.
 */
export const clearSession = () => {
  useAuthStore.getState().clear();

  // 도는 실행부터 끊는다. 남겨 두면 방금 비운 채팅에 이전 사용자의 답변이 다시 쌓인다.
  abortRunStream();

  clearQueryCache();
  useChatStore.getState().reset();
  // 상단바 '프로젝트'가 이전 사용자의 프로젝트로 들어가지 않게 한다 (localStorage 라 리로드로도 안 지워진다)
  useLastProjectStore.getState().clear();
};

// 다른 탭에서 로그인·로그아웃하면 이 탭도 따라간다.
// 같은 사용자의 토큰 재발급이면 새 토큰만 조용히 받는다 — 작성 중인 화면을 리로드로 날리지 않는다.
// 사용자가 바뀌었으면 이 탭에 남은 것은 전부 남의 것이라 문서째 새로 연다.
// (여기서 토큰을 지우면 방금 로그인한 저쪽 탭까지 끊긴다 — 화면만 버리고 토큰은 그대로 둔다)
const followAuthChange = async (event: StorageEvent) => {
  if (event.key !== AUTH_STORAGE_KEY) return;

  const before = decodeUserId(useAuthStore.getState().accessToken);
  await useAuthStore.persist.rehydrate();
  const after = decodeUserId(useAuthStore.getState().accessToken);

  if (before === after) return;

  useLastProjectStore.getState().clear();
  window.location.href = after ? HOME_PATH : LOGIN_PATH;
};

const handleStorage = (event: StorageEvent) => {
  void followAuthChange(event);
};

/** 탭 사이 계정 전환을 지켜본다. 해제 함수를 돌려준다. */
export const watchSessionAcrossTabs = () => {
  window.addEventListener("storage", handleStorage);

  return () => window.removeEventListener("storage", handleStorage);
};
