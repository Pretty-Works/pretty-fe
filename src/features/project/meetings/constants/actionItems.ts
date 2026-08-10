import type { BadgeType } from "@/components/Badge/Badge";

import type {
  MeetingActionItem,
  MeetingActionItemStatus,
} from "@/features/project/meetings/types";

// 실행 항목 상태 색 — 목록·개요의 상태 배지와 같은 어휘를 쓴다
export const ACTION_ITEM_BADGE: Record<MeetingActionItemStatus, BadgeType> = {
  진행중: "blue",
  예정: "elephant",
  완료: "green",
};

// 실행 항목을 내려주는 API가 아직 없다(회의록 상세는 후속 조치를 자유 텍스트로만 준다).
// 화면을 먼저 확인하려고 두는 목업이라, 조회 훅이 생기면 이 상수만 걷어내면 된다.
export const MOCK_ACTION_ITEMS: MeetingActionItem[] = [
  {
    id: "1",
    task: "결제 모듈 연동 범위 확정안 공유",
    owner: "김하늘",
    due: "2026-08-14",
    status: "진행중",
  },
  {
    id: "2",
    task: "정산 배치 장애 재발 방지 대책 문서화",
    owner: "박도윤",
    due: "2026-08-18",
    status: "예정",
  },
  {
    id: "3",
    task: "1차 QA 시나리오 초안 검토 요청",
    owner: "이서연",
    due: "2026-08-21",
    status: "예정",
  },
  {
    id: "4",
    task: "외부 PG사 계약 조건 회신 취합",
    owner: "정민재",
    due: "2026-08-07",
    status: "완료",
  },
];
