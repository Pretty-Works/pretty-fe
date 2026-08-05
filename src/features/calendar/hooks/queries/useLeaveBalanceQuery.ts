import { useQuery } from "@tanstack/react-query";

import { fetchLeaveBalance } from "@/features/calendar/api/calendarApi";

// 연차 현황 카드 — 응답이 이미 화면 모양(LeaveSummary)이라 변환이 없다.
export const useLeaveBalanceQuery = () => {
  return useQuery({
    queryKey: ["calendar", "leaveBalance"],
    queryFn: fetchLeaveBalance,
    // 휴가를 등록·취소하면 그때 무효화하므로 평소엔 다시 부를 이유가 없다
    staleTime: 5 * 60 * 1000,
  });
};
