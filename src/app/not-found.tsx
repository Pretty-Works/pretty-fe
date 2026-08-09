"use client";

import { useRouter } from "next/navigation";

import ErrorPage from "@/layouts/ErrorPage/ErrorPage";

export default function NotFound() {
  const router = useRouter();

  return (
    <ErrorPage
      statusCode={404}
      onRightButtonClick={() => router.replace("/")}
    />
  );
}
