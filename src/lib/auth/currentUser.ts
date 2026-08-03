"use client";

import { useMemo } from "react";

import { useAuthStore } from "@/stores/useAuthStore";

// 백엔드에 "내 정보 조회" API가 없어서 accessToken(JWT) payload의 uid 클레임에서 읽는다.
// (BE AuthConstant.USER_ID_CLAIM_NAME = "uid")
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
