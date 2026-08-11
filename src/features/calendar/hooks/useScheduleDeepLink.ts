"use client";

import { useEffect, useRef } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  fetchSchedule,
  isScheduleNotFound,
} from "@/features/calendar/api/calendarApi";
import type { CalendarEvent } from "@/features/calendar/types";
import { toEvent } from "@/features/calendar/utils/scheduleMapper";

interface ScheduleDeepLinkHandlers {
  /** 찾았을 때 — 그 달로 옮기고 일정을 연다 */
  onOpen: (event: CalendarEvent) => void;
  /** 지워졌거나 조회에 실패했을 때 */
  onMissing: (message: string) => void;
}

/**
 * 알림에서 넘어온 딥링크 `/calendar?scheduleId=42` 를 한 번 처리한다.
 *
 * `ready`는 "내 id를 알고 있는가" — 작성자인지에 따라 수정/보기가 갈려서,
 * 모르는 채로 열면 내 일정도 보기 전용으로 뜬다.
 *
 * 캘린더의 다른 조회와 달리 react-query를 쓰지 않는다. 화면에 붙어 있는 서버 상태가 아니라
 * 링크 한 번을 처리하는 일회성 명령이라 캐시할 이유가 없다.
 */
export const useScheduleDeepLink = (
  ready: boolean,
  handlers: ScheduleDeepLinkHandlers,
) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scheduleId = searchParams.get("scheduleId");

  // 콜백은 렌더마다 새로 만들어진다. ref로 받아 두면 조회가 다시 나가지 않는다.
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    // 처리가 끝나면 주소에서 id를 지우므로, 그때 표식도 함께 푼다.
    // 안 풀면 같은 일정에 대한 알림을 두 번째 눌렀을 때 아무 일도 일어나지 않는다.
    if (!scheduleId) {
      handledRef.current = null;
      return;
    }

    if (!ready) return;
    // 한 링크는 한 번만 연다 (닫은 모달이 리렌더마다 되살아나지 않게)
    if (handledRef.current === scheduleId) return;

    handledRef.current = scheduleId;

    // ⚠️ 정리 함수로 응답을 버리지 않는다. StrictMode의 두 번째 mount는 위 표식에 막혀
    //    되쏘지 않으므로, 첫 요청을 취소해 버리면 개발 중엔 영영 열리지 않는다.
    //    ref로 최신 콜백을 부르기 때문에 늦게 도착해도 살아 있는 화면에 닿는다.
    fetchSchedule(scheduleId)
      .then((schedule) => handlersRef.current.onOpen(toEvent(schedule)))
      .catch((error) =>
        // 404는 그 사이 지워진 일정이다. 나머지는 조회 자체가 실패한 것.
        handlersRef.current.onMissing(
          isScheduleNotFound(error)
            ? "이미 삭제된 일정이에요"
            : "일정을 불러오지 못했어요",
        ),
      )
      // 주소를 비우는 건 반드시 처리가 끝난 뒤다 — 먼저 지우면 scheduleId가 바뀌면서
      // 이 effect가 정리되고, 응답이 도착하기도 전에 모든 게 끝나 버린다.
      // (모달을 닫고 새로고침·뒤로가기 해도 다시 열리지 않게 하려는 목적)
      .finally(() => router.replace(pathname, { scroll: false }));
  }, [scheduleId, ready, router, pathname]);
};
