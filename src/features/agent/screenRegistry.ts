// 화면 식별자 → 라우트 매핑
export function resolveRoute(
  targetScreen?: string,
  params?: Record<string, unknown>
): string | null {
  const p = params ?? {};

  switch (targetScreen) {
    case "MEETING_CREATE":
      return `/projects/${String(p.projectId)}/meetings/write`;
    default:
      return null;
  }
}
