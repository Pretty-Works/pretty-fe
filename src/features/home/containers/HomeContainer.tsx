"use client";

import { useHomeViewModel } from "@/features/home/hooks/useHomeViewModel";
import HomeView from "@/features/home/views/HomeView/HomeView";

export default function HomeContainer() {
  const model = useHomeViewModel();

  return <HomeView model={model} />;
}
