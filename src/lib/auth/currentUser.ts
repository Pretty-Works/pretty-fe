"use client";

import { useMemo } from "react";

import { useAuthStore } from "@/stores/useAuthStore";

// accessToken(JWT) payload의 uid 클레임에서 내 userId를 읽는다.
// (BE AuthConstant.USER_ID_CLAIM_NAME = "uid")
// 이름까지 필요한 곳은 GET /users/me(useMyProfileQuery)를 쓰고, 여기는 그 응답이 오기 전
// "내 것인지"만 가려내야 하는 순간(캘린더 진입 직후 등)을 위한 즉시 조회다.
export function decodeUserId(token: string | null): string | null {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    // base64url → base64
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const uid = JSON.parse(json)?.uid;

    return uid != null ? String(uid) : null;
  } catch {
    // 토큰이 깨져 있으면 비로그인과 같게 취급한다 (요청은 인터셉터가 401로 처리)
    return null;
  }
}

/** 훅 밖(쿼리 함수 등)에서 쓰는 조회 */
export const getCurrentUserId = () =>
  decodeUserId(useAuthStore.getState().accessToken);

/** 컴포넌트에서 쓰는 조회 — 로그인/로그아웃 시 함께 갱신된다 */
export const useCurrentUserId = () => {
  const token = useAuthStore((state) => state.accessToken);

  return useMemo(() => decodeUserId(token), [token]);
};
