"use client";

import { useMemo } from "react";

import { useAuthStore } from "@/stores/useAuthStore";

import { decodeUserId } from "./token";

// 이름까지 필요한 곳은 GET /users/me(useMyProfileQuery)를 쓰고, 여기는 그 응답이 오기 전
// "내 것인지"만 가려내야 하는 순간(캘린더 진입 직후 등)을 위한 즉시 조회다.
export { decodeUserId };

/** 훅 밖(쿼리 함수 등)에서 쓰는 조회 */
export const getCurrentUserId = () =>
  decodeUserId(useAuthStore.getState().accessToken);

/** 컴포넌트에서 쓰는 조회 — 로그인/로그아웃 시 함께 갱신된다 */
export const useCurrentUserId = () => {
  const token = useAuthStore((state) => state.accessToken);

  return useMemo(() => decodeUserId(token), [token]);
};
