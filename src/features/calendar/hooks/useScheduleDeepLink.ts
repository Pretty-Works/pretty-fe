"use client";

import { useEffect, useRef } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  fetchSchedule,
  isScheduleNotFound,
} from "@/features/calendar/api/calendarApi";
import type { CalendarEvent } from "@/features/calendar/types";
import { toEvent } from "@/features/calendar/utils/scheduleMapper";

// "YYYY-MM-DD"만 받는다. 그 외 값이 붙어 들어와도 Date 생성으로 흘려보내지 않는다.
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

interface ScheduleDeepLinkHandlers {
  /** 일정을 찾았을 때 — 그 달로 옮기고 일정을 연다 */
  onOpen: (event: CalendarEvent) => void;
  /** 날짜만 받았을 때 — 그 달로 옮기고 날짜만 고른다(모달 없음) */
  onFocusDate: (dateKey: string) => void;
  /** 지워졌거나 조회에 실패했을 때 */
  onMissing: (message: string) => void;
}

/**
 * 알림에서 넘어온 딥링크를 한 번 처리한다. 두 갈래다.
 *
 * - `?scheduleId=42` — 그 일정을 열어야 하는 알림(참가자 추가·시간 변경).
 *   날짜를 모르니 단건 조회로 일정을 받아 그 달로 옮기고 모달을 연다.
 * - `?date=2026-08-20` — 열 일정이 없는 알림(제외·삭제). 그 일정은 이미 내 것이 아니거나
 *   사라졌지만 비게 된 시간은 봐야 한다. **조회 없이** 날짜만 고른다.
 *
 * `ready`는 "내 id를 알고 있는가" — 작성자인지에 따라 수정/보기가 갈려서,
 * 모르는 채로 열면 내 일정도 보기 전용으로 뜬다. 날짜 이동은 모달을 열지 않으므로 해당 없다.
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
  const dateKey = searchParams.get("date");

  // 콜백은 렌더마다 새로 만들어진다. ref로 받아 두면 조회가 다시 나가지 않는다.
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  // 손대지 않은 값이 그대로 Date로 흘러가지 않게 형식을 확인한 뒤에만 쓴다
  const focusDate = dateKey && DATE_KEY.test(dateKey) ? dateKey : null;

  // 두 갈래를 한 표식으로 묶는다. 일정 쪽이 우선 — 열 수 있으면 여는 게 낫다.
  const linkKey = scheduleId ?? (focusDate ? `date:${focusDate}` : null);

  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    // 처리가 끝나면 주소를 비우므로, 그때 표식도 함께 푼다.
    // 안 풀면 같은 알림을 두 번째 눌렀을 때 아무 일도 일어나지 않는다.
    if (!linkKey) {
      handledRef.current = null;
      return;
    }

    // 한 링크는 한 번만 처리한다 (닫은 모달이 리렌더마다 되살아나지 않게)
    if (handledRef.current === linkKey) return;

    // 날짜 이동은 조회도, 내 id도 필요 없다. 모달을 열지 않으니 작성자 판정이 없다.
    if (!scheduleId && focusDate) {
      handledRef.current = linkKey;
      handlersRef.current.onFocusDate(focusDate);
      router.replace(pathname, { scroll: false });
      return;
    }

    if (!scheduleId) return;
    if (!ready) return;

    handledRef.current = linkKey;

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
  }, [linkKey, scheduleId, focusDate, ready, router, pathname]);
};
