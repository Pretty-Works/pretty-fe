"use client";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";

import { getApiErrorMessage, isClientError } from "@/lib/api/errorCode";
import { registerQueryClient } from "@/lib/api/queryCache";
import { useToastStore } from "@/stores/useToastStore";

const toastError = (message: string) =>
  useToastStore.getState().showToast(message, "danger");

const createQueryClient = () =>
  new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
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

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
