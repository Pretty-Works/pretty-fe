"use client";

import {
  Profiler,
  type ProfilerOnRenderCallback,
  type ReactNode,
} from "react";

// React가 한 번 커밋할 때 전달하는 원본 측정값이다.
export interface RenderProfileSample {
  id: string;
  phase: "mount" | "update" | "nested-update";
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
}

// 같은 측정 범위에서 모인 커밋들의 비교용 요약값이다.
interface RenderProfileSummary {
  commits: number;
  totalDuration: number;
  averageDuration: number;
  maxDuration: number;
  averageBaseDuration: number;
}

// 콘솔에서 측정값을 조회하고 초기화할 수 있게 공개하는 저장소다.
interface RenderProfilerStore {
  samples: RenderProfileSample[];
  reset: () => void;
  summary: () => Record<string, RenderProfileSummary>;
}

// 개발자 도구 콘솔에서 접근할 전역 저장소의 타입을 선언한다.
declare global {
  interface Window {
    __PRETTY_RENDER_PROFILER__?: RenderProfilerStore;
  }
}

// 장시간 개발해도 측정 기록이 메모리를 계속 차지하지 않게 제한한다.
const MAX_SAMPLES = 500;

// 기록과 비교가 편하도록 밀리초 값을 소수점 둘째 자리까지 맞춘다.
const round = (value: number) => Math.round(value * 100) / 100;

// 측정값 보관·초기화·범위별 요약 기능을 가진 저장소를 만든다.
const createStore = (): RenderProfilerStore => {
  const samples: RenderProfileSample[] = [];

  return {
    samples,
    reset: () => {
      samples.length = 0;
    },
    summary: () => {
      const grouped = Object.groupBy(samples, ({ id }) => id);

      return Object.fromEntries(
        Object.entries(grouped).map(([id, entries = []]) => {
          const totalDuration = entries.reduce(
            (total, entry) => total + entry.actualDuration,
            0,
          );
          const totalBaseDuration = entries.reduce(
            (total, entry) => total + entry.baseDuration,
            0,
          );

          return [
            id,
            {
              commits: entries.length,
              totalDuration: round(totalDuration),
              averageDuration: round(totalDuration / entries.length),
              maxDuration: round(
                Math.max(...entries.map((entry) => entry.actualDuration)),
              ),
              averageBaseDuration: round(
                totalBaseDuration / entries.length,
              ),
            },
          ];
        }),
      );
    },
  };
};

// React Profiler가 커밋을 마칠 때마다 측정값을 저장하고 콘솔에 남긴다.
const recordRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime,
) => {
  const store = (window.__PRETTY_RENDER_PROFILER__ ??= createStore());
  const sample: RenderProfileSample = {
    id,
    phase,
    actualDuration: round(actualDuration),
    baseDuration: round(baseDuration),
    startTime: round(startTime),
    commitTime: round(commitTime),
  };

  store.samples.push(sample);
  if (store.samples.length > MAX_SAMPLES) store.samples.shift();

  console.info("[RenderProfiler]", JSON.stringify(sample));
};

// UI를 추가하지 않고 자식 컴포넌트 트리의 렌더 비용만 측정한다.
export default function RenderProfiler({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  if (process.env.NODE_ENV === "production") return children;

  return (
    <Profiler id={id} onRender={recordRender}>
      {children}
    </Profiler>
  );
}
