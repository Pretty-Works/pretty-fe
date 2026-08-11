"use client";

import { ReactNode, useEffect, useState } from "react";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { getApiErrorMessage, isClientError } from "@/lib/api/errorCode";
import { registerQueryClient } from "@/lib/api/queryCache";
import { watchSessionAcrossTabs } from "@/lib/auth/session";

import { useToastStore } from "@/stores/useToastStore";

const toastError = (message: string) =>
  useToastStore.getState().showToast(message, "danger");

const createQueryClient = () =>
  new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // 없어도 화면이 멀쩡한 부가 조회(meta.silentError)는 실패를 알리지 않는다 —
        // 에이전트 추천 문구처럼 자리를 접으면 끝나는 것들이다. 토스트가 오히려 사고처럼 보인다.
        if (query.meta?.silentError) return;

        if (query.state.data !== undefined) {
          toastError(
            getApiErrorMessage(
              error,
              "최신 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
            ),
          );
        }
      },
    }),

    mutationCache: new MutationCache({
      onError: (error) => {
        toastError(
          getApiErrorMessage(
            error,
            "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
          ),
        );
      },
    }),

    defaultOptions: {
      queries: {
        retry: (failureCount, error) =>
          !isClientError(error) && failureCount < 1,
        staleTime: 30 * 1000,
      },
    },
  });

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  // axios 인터셉터가 세션 만료 시 캐시를 비울 수 있게 등록한다.
  // 렌더 중이 아니라 마운트 후에 등록해야 서버 렌더에서 모듈 변수가 오염되지 않는다.
  useEffect(() => {
    registerQueryClient(queryClient);
  }, [queryClient]);

  // 다른 탭에서 계정이 바뀌면 이 탭도 따라간다. window 가 필요해 마운트 후에 붙인다.
  useEffect(() => watchSessionAcrossTabs(), []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
