import type {
  CalendarEvent,
  CalendarMember,
  CalendarProject,
  LeaveSummary,
} from "@/features/calendar/types";

// API 연결 전이라 화면 확인용 목데이터 (기준 월: 2026년 2월)
export const MOCK_TODAY = "2026-02-28";
export const MOCK_INITIAL_MONTH = new Date(2026, 1, 1);
export const MOCK_INITIAL_SELECTED = "2026-02-24";

export const MOCK_PROJECTS: CalendarProject[] = [
  { id: "p1", name: "그룹웨어 AI 고도화", memberIds: ["m1", "m2"] },
  { id: "p2", name: "검색 인덱스 개선", memberIds: ["m2", "m3"] },
  { id: "p3", name: "재무 시스템 고도화", memberIds: ["m3"] },
];

export const MOCK_CHECKED_PROJECT_IDS = ["p1", "p2"];

export const MOCK_ME: CalendarMember = {
  id: "m0",
  name: "김서준",
  color: "#7c3aed",
  isMe: true,
};

export const MOCK_MEMBERS: CalendarMember[] = [
  { id: "m1", name: "정우진", color: "#3b82eb" },
  { id: "m2", name: "이하늘", color: "#219966" },
  { id: "m3", name: "한도윤", color: "#e8830c" },
];

export const MOCK_LEAVE: LeaveSummary = {
  year: 2026,
  grantedDays: 17,
  usedDays: 7,
  remainingDays: 9,
  tenureYears: "5년 0개월",
};

export const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: "e1",
    title: "이하늘 재택",
    memberId: "m2",
    start: "2026-02-04",
    end: "2026-02-04",
    time: "09:00",
  },
  {
    id: "e2",
    title: "정우진 연차",
    memberId: "m1",
    start: "2026-02-05",
    end: "2026-02-05",
    isLeave: true,
    leaveType: "ANNUAL",
  },
  {
    id: "e3",
    title: "주간 회의",
    memberId: "m0",
    start: "2026-02-10",
    end: "2026-02-10",
    time: "10:00",
    projectId: "p1",
  },
  {
    id: "e4",
    title: "정우진 외근",
    memberId: "m1",
    start: "2026-02-11",
    end: "2026-02-11",
    time: "13:00",
  },
  {
    id: "e5",
    title: "1:1 미팅",
    memberId: "m0",
    start: "2026-02-12",
    end: "2026-02-12",
    time: "15:00",
    projectId: "p1",
  },
  {
    id: "e6",
    title: "벤더 미팅",
    memberId: "m0",
    start: "2026-02-17",
    end: "2026-02-17",
    time: "11:00",
    projectId: "p2",
  },
  {
    id: "e7",
    title: "치과 예약",
    memberId: "m0",
    start: "2026-02-18",
    end: "2026-02-18",
    time: "18:00",
  },
  {
    id: "e8",
    title: "리뷰 미팅",
    memberId: "m0",
    start: "2026-02-20",
    end: "2026-02-20",
    time: "16:00",
    projectId: "p2",
  },
  {
    id: "e9",
    title: "외근 - 고객사 미팅",
    memberId: "m3",
    start: "2026-02-23",
    end: "2026-02-23",
    time: "14:00",
  },
  {
    id: "e10",
    title: "팀 점심",
    memberId: "m0",
    start: "2026-02-24",
    end: "2026-02-24",
    time: "12:00",
  },
  {
    id: "e11",
    title: "스프린트 리뷰",
    memberId: "m1",
    start: "2026-02-24",
    end: "2026-02-24",
    time: "14:00",
    endTime: "15:00",
    projectId: "p1",
    type: "MEETING",
    participantIds: ["m1", "m2"],
  },
  {
    id: "e12",
    title: "고객사 외근",
    memberId: "m2",
    start: "2026-02-24",
    end: "2026-02-24",
    time: "16:00",
    projectId: "p2",
  },
  {
    id: "e13",
    title: "✈️ 부산 출장",
    memberId: "m1",
    start: "2026-02-25",
    end: "2026-02-28",
    type: "FIELDWORK",
  },
];
