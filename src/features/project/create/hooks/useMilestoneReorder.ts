"use client";

import { useState } from "react";

// 마일스톤 순서 변경. 손잡이를 누른 행만 draggable이 된다(입력 선택 방해 방지).
export function useMilestoneReorder(move: (from: number, to: number) => void) {
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const reset = () => {
    setDragIndex(null);
    setOverIndex(null);
    setDragKey(null);
  };

  return {
    dragKey,
    dragIndex,
    overIndex,
    grab: setDragKey,
    // Firefox는 dragstart에서 dataTransfer에 무언가 담기지 않으면 드래그를 시작하지 않는다
    start: (index: number, event: React.DragEvent) => {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(index));
      setDragIndex(index);
    },
    over: (index: number, event: React.DragEvent) => {
      event.preventDefault();
      setOverIndex(index);
    },
    drop: (index: number) => {
      if (dragIndex !== null) move(dragIndex, index);
      reset();
    },
    end: reset,
  };
}
