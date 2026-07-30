// 에이전트 화면 목업 데이터

import type {
  AgentAction,
  AgentChoice,
  ChatMessage,
  Conversation,
} from "@/features/agent/types";

export const RECOMMENDED_PROMPTS: string[] = [
  "오늘 회의록 작성해줘",
  "이번 주 내 업무 우선순위 정리해줘",
  "다음 주 수요일 휴가 신청 초안 만들어줘",
  "내일 오후 2시 회의실 예약해줘",
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  { id: "c1", title: "7월 팀 회의 준비" },
  { id: "c2", title: "지출결의서 작성" },
  { id: "c3", title: "휴가 일정 상담", pending: true },
  { id: "c4", title: "회의실 예약" },
  { id: "c5", title: "업무 우선순위 정리" },
];

export const MOCK_HISTORY: Record<string, ChatMessage[]> = {
  c1: [
    { id: "c1-1", role: "user", content: "7월 팀 회의록 작성해줘", createdAt: "2026-07-21T01:00:00.000Z" },
    { id: "c1-2", role: "agent", content: "7월 팀 회의록 초안을 준비했어요. 작성 화면으로 이동할까요?", createdAt: "2026-07-21T01:00:03.000Z" },
  ],
  c2: [
    { id: "c2-1", role: "user", content: "7월 소모품 지출결의서 작성해줘", createdAt: "2026-07-20T02:00:00.000Z" },
    { id: "c2-2", role: "agent", content: "지출결의서 초안을 만들었어요. 금액과 사유를 확인해 주세요.", createdAt: "2026-07-20T02:00:04.000Z" },
  ],
  c3: [
    { id: "c3-1", role: "user", content: "다음 주에 휴가 쓸 수 있을까?", createdAt: "2026-07-19T05:00:00.000Z" },
    { id: "c3-2", role: "agent", content: "다음 주 수요일 일정이 비어 있어요. 연차 신청 초안을 만들어 드릴까요?", createdAt: "2026-07-19T05:00:03.000Z" },
  ],
  c4: [
    { id: "c4-1", role: "user", content: "내일 오후 2시 회의실 예약", createdAt: "2026-07-18T06:00:00.000Z" },
    { id: "c4-2", role: "agent", content: "내일 14:00 프로젝트룸 B가 비어 있어요. 예약할까요?", createdAt: "2026-07-18T06:00:03.000Z" },
  ],
  c5: [
    { id: "c5-1", role: "user", content: "내 업무 우선순위 정리해줘", createdAt: "2026-07-17T07:00:00.000Z" },
    { id: "c5-2", role: "agent", content: "마감일 기준으로 3건을 '높음'으로 올렸어요.", createdAt: "2026-07-17T07:00:03.000Z" },
  ],
};

// SSE 한 요청의 목업 결과
export interface MockScenario {
  answer: string;
  conversationTitle?: string;
  action?: AgentAction;
  choice?: AgentChoice;
}

export function buildMockResponse(text: string): MockScenario {
  if (/회의록|회의/.test(text)) {
    return {
      answer:
        "'그룹웨어 AI 고도화' 스프린트 리뷰 회의록 초안을 만들었어요.\n" +
        "· 회의명: 스프린트 리뷰\n" +
        "· 일시: 2026-07-30 / 프로젝트룸 A\n" +
        "· 참석자: 김서준, 이하늘, 정우진\n" +
        "이 내용대로 저장할까요?",
      conversationTitle: "그룹웨어 AI 고도화 스프린트 리뷰 회의록",
      action: {
        type: "MEETING_CREATE",
        requiresApproval: true,
        summary: "회의록 저장 · 그룹웨어 AI 고도화",
        successMessage: "회의록을 저장했어요. 회의록 탭에서 확인할 수 있어요.",
        targetScreen: "MEETING_CREATE",
        params: { projectId: 3 },
        formData: {
          title: "스프린트 리뷰",
          meetingDate: "2026-07-30",
          location: "프로젝트룸 A",
          attendeeIds: [2, 5, 7],
          purpose: "스프린트 진행상황 공유 및 다음 계획 확정",
          content:
            "· 백엔드 API 68% 완료\n· 검색 커서 전환 진행 중\n· LLM 연동 스펙 다음 주 확정",
          followUp: "· API 명세 갱신 — 이하늘, 8/2\n· 커서 전환 완료 — 정우진, 8/5",
          recording: null,
        },
      },
    };
  }

  if (/예약|회의실/.test(text)) {
    return {
      answer: "예약할 회의실을 선택해 주세요.",
      choice: {
        id: "room-choice",
        question: "어느 회의실로 예약할까요?",
        options: ["프로젝트룸 A", "프로젝트룸 B", "폰부스 1"],
        placeholder: "회의실명을 직접 입력",
      },
    };
  }

  return {
    answer: `"${text}" 요청을 확인했어요.`,
  };
}
