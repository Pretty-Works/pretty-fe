import type { QueryClient } from "@tanstack/react-query";

// axios 인터셉터는 훅 밖이라 useQueryClient를 쓸 수 없다.
let queryClient: QueryClient | null = null;

export const registerQueryClient = (client: QueryClient) => {
  queryClient = client;
};

// 세션이 끊겼을 때 이전 사용자의 응답을 한 조각도 남기지 않는다.
export const clearQueryCache = () => {
  queryClient?.clear();
};
