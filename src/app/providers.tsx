"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";

import { registerQueryClient } from "@/lib/api/queryCache";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
          },
        },
      })
  );

  // axios 인터셉터가 세션 만료 시 캐시를 비울 수 있게 등록한다.
  // 렌더 중이 아니라 마운트 후에 등록해야 서버 렌더에서 모듈 변수가 오염되지 않는다.
  useEffect(() => {
    registerQueryClient(queryClient);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}