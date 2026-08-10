// accessToken(JWT) payload의 uid 클레임에서 userId를 읽는다.
// (BE AuthConstant.USER_ID_CLAIM_NAME = "uid")
// 스토어·리액트에 기대지 않는 순수 함수라, 훅을 쓸 수 없는 자리(세션 정리 등)에서도 부른다.
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
