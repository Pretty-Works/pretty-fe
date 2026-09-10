"use client";

import QueryBoundary from "@/components/QueryBoundary/QueryBoundary";
import { useHomeViewModel } from "@/features/home/hooks/useHomeViewModel";
import HomeView from "@/features/home/views/HomeView/HomeView";
import { useMyProfileQuery } from "@/features/user/hooks/queries/useMyProfileQuery";

import styles from "@/features/home/views/HomeView/HomeView.module.css";

function HomeContentContainer() {
  const model = useHomeViewModel();

  return <HomeView model={model} />;
}

export default function HomeContainer() {
  const { data: me } = useMyProfileQuery();

  return (
    <main className={styles.container}>
      {/* 홈 데이터가 느려도 LCP 후보인 인사말은 먼저 표시한다. */}
      <h1 className={styles.greeting}>안녕하세요. {me?.name ?? ""}님</h1>

      <QueryBoundary name="HomeContent">
        <HomeContentContainer />
      </QueryBoundary>
    </main>
  );
}
