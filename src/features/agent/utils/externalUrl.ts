export function resolveAllowedExternalUrl(
  value: unknown,
  allowedOrigin: string,
): string | null {
  if (typeof value !== "string" || !value || !allowedOrigin) return null;

  try {
    const url = new URL(value);
    const origin = new URL(allowedOrigin);

    // origin 정확 일치만 허용. endsWith/includes 로 바꾸지 말 것 —
    // agent.example.com.evil.com 이 통과한다.
    // javascript:·data: 는 origin 이 "null" 이라 여기서 걸린다.
    // 프로토콜은 따로 보지 않는다 — 로컬 에이전트가 http://localhost:8000 이라서다.
    if (url.origin !== origin.origin) return null;

    return url.toString();
  } catch {
    return null;
  }
}
