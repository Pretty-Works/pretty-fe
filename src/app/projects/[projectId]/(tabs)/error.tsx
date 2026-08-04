"use client";

import { useEffect } from "react";

import ErrorPage from "@/layouts/ErrorPage/ErrorPage";

export default function ProjectTabsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorPage
      statusCode={500}
      title="이 화면을 표시하지 못했어요"
      subtitle="일시적인 오류일 수 있어요. 다시 시도하거나 왼쪽 메뉴에서 다른 화면으로 이동해 주세요."
      onRightButtonClick={reset}
    />
  );
}
