"use client";

import { useEffect } from "react";

import ErrorPage from "@/layouts/ErrorPage/ErrorPage";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: Sentry 같은 리포팅 도구 연동 지점 (digest로 서버 로그와 대조)
    console.error(error);
  }, [error]);

  return (
    <ErrorPage
      statusCode={500}
      onLeftButtonClick={() => {
        window.location.href = "/";
      }}
      onRightButtonClick={reset}
    />
  );
}
