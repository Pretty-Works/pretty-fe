import { useQuery } from "@tanstack/react-query";

import { fetchLeaveBalance } from "@/features/calendar/api/calendarApi";

// 연차 현황 카드 — 응답이 이미 화면 모양(LeaveSummary)이라 변환이 없다.
export const useLeaveBalanceQuery = () => {
  return useQuery({
    queryKey: ["calendar", "leaveBalance"],
    queryFn: fetchLeaveBalance,
  });
};
