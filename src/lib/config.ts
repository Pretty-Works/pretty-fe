// 배포 환경
export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

/** Agent가 발급한 OAuth URL에 허용할 origin. 비어 있으면 외부 URL을 열지 않는다. */
export const AGENT_OAUTH_ORIGIN =
    process.env.NEXT_PUBLIC_AGENT_OAUTH_ORIGIN?.replace(/\/$/, "") ?? "";
