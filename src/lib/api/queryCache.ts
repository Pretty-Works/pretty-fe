import type { QueryClient } from "@tanstack/react-query";

// axios 인터셉터는 훅 밖이라 useQueryClient를 쓸 수 없다.
// Providers가 마운트될 때(클라이언트에서만) 인스턴스를 여기 등록해 두고 꺼내 쓴다.
//
// 서버에서는 등록되지 않아 항상 null이다. 모듈 변수는 요청 간에 공유되므로,
// 서버에서 채웠다면 다른 사용자의 캐시를 건드릴 수 있다.
let queryClient: QueryClient | null = null;

export const registerQueryClient = (client: QueryClient) => {
  queryClient = client;
};

// 세션이 끊겼을 때 이전 사용자의 응답을 한 조각도 남기지 않는다.
export const clearQueryCache = () => {
  queryClient?.clear();
};
