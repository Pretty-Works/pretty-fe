// 서버 errorCode 를 화면에 그대로 띄울 문장으로 바꾼다.
//
// 서버 message 는 원인을 개발자에게 알려주는 문장이라 화면 말투와 다르고,
// 내부 사정(내부 API 인증·DB 제약)이나 예외 이름이 섞여 오기도 한다.
// 그래서 사용자에게는 언제나 코드로 갈아 끼운 문장만 내보낸다 — 코드 자체는 절대 노출하지 않는다.
//
// 여기 없는 코드는 각 화면의 fallback 으로 떨어진다. 화면이 더 정확히 말할 수 있는 자리
// (예: 게시글 등록의 MEMBER_001)는 그 화면에서 따로 매핑해 이 표를 덮어쓴다.

const LOGIN_REQUIRED = "로그인이 필요해요. 다시 로그인해 주세요.";
const LOGIN_EXPIRED = "로그인이 만료됐어요. 다시 로그인해 주세요.";
const SERVER_TROUBLE = "서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.";
const BAD_REQUEST = "요청을 보내지 못했어요. 잠시 후 다시 시도해 주세요.";

export const ERROR_MESSAGE: Record<string, string> = {
  // 공통 요청 (REQUEST_)
  REQUEST_001: "입력한 내용을 다시 확인해 주세요.",
  REQUEST_002: LOGIN_REQUIRED,
  REQUEST_003: LOGIN_REQUIRED,
  REQUEST_004: LOGIN_REQUIRED,
  REQUEST_005: LOGIN_REQUIRED,
  REQUEST_006: "이 작업을 할 권한이 없어요.",
  REQUEST_007: "찾을 수 없는 내용이에요. 이미 삭제됐을 수 있어요.",
  REQUEST_008: "요청 시간이 지났어요. 다시 시도해 주세요.",
  REQUEST_009: BAD_REQUEST,
  REQUEST_010: BAD_REQUEST,
  REQUEST_011: "보낼 수 없는 형식이에요.",
  REQUEST_012: "고를 수 없는 값이에요. 다시 골라 주세요.",
  REQUEST_013: LOGIN_REQUIRED,
  REQUEST_014: LOGIN_EXPIRED,
  REQUEST_015: LOGIN_EXPIRED,
  REQUEST_016: LOGIN_EXPIRED,
  REQUEST_017: LOGIN_EXPIRED,
  REQUEST_018: LOGIN_EXPIRED,
  REQUEST_019: "카카오 로그인에 실패했어요. 다시 시도해 주세요.",
  REQUEST_020: BAD_REQUEST,
  REQUEST_021: BAD_REQUEST,
  REQUEST_022: "이미 있는 값이거나 다른 곳에서 쓰이고 있어 처리할 수 없어요.",
  REQUEST_023: LOGIN_EXPIRED,
  REQUEST_024: LOGIN_EXPIRED,
  REQUEST_025: LOGIN_EXPIRED,
  REQUEST_026: "파일을 함께 보내 주세요.",
  REQUEST_027: "파일 크기가 너무 커요.",
  REQUEST_028: "같은 요청이 이미 접수됐어요. 잠시 후 다시 시도해 주세요.",
  REQUEST_029: "다른 사람이 먼저 수정했어요. 새로고침한 뒤 다시 시도해 주세요.",

  // 세션이 끊긴 이유. 보통은 재발급 실패 경로에서 로그인 화면이 꺼내 읽지만(client.ts),
  // 그 경로 밖에서 올라와도 뭉뚱그린 문장으로 떨어지지 않게 표에도 둔다.
  REQUEST_030: "다른 기기에서 로그인해 이 기기는 로그아웃됐어요.",
  REQUEST_031: "보안을 위해 로그아웃됐어요. 다시 로그인해 주세요.",
  REQUEST_032: "더 이상 이용할 수 없는 계정이에요.",

  // 서버 실패 (RESPONSE_) — 원인은 사용자가 할 수 있는 일과 무관해 한 문장으로 묶는다
  RESPONSE_001: SERVER_TROUBLE,
  RESPONSE_002: SERVER_TROUBLE,
  RESPONSE_003: SERVER_TROUBLE,
  RESPONSE_004: SERVER_TROUBLE,
  RESPONSE_005: SERVER_TROUBLE,
  RESPONSE_006: SERVER_TROUBLE,

  // 로그인·회원 (AUTH_ · USER_)
  AUTH_001: "이미 사용 중인 이메일이에요.",
  AUTH_002: "이미 사용 중인 사번이에요.",
  AUTH_003: "사번 또는 비밀번호를 확인해 주세요.",
  USER_001: "재직 중인 사용자만 이용할 수 있어요.",
  USER_002: "사용자를 찾을 수 없어요.",
  USER_003: "퇴사한 사용자는 이용할 수 없어요.",

  // 프로젝트 (PROJECT_ · MEMBER_)
  MEMBER_001: "이 프로젝트에 참여 중일 때만 할 수 있어요.",
  PROJECT_001: "프로젝트를 만들 권한이 없어요.",
  PROJECT_002: "참여자 중 찾을 수 없는 사용자가 있어요.",
  PROJECT_003: "종료일은 시작일 이후여야 해요.",
  PROJECT_004: "프로젝트를 찾을 수 없어요. 이미 삭제됐을 수 있어요.",
  PROJECT_005: "프로젝트 오너와 PM만 수정할 수 있어요.",
  PROJECT_015: "마일스톤 목표일이 프로젝트 기간을 벗어났어요.",
  PROJECT_016: "마일스톤은 목표일과 내용을 모두 입력해 주세요.",
  PROJECT_017: "프로젝트 오너와 PM만 상태를 바꿀 수 있어요.",
  PROJECT_018: "고를 수 없는 상태예요.",
  PROJECT_019: "완료·삭제된 프로젝트는 되돌릴 수 없어요.",
  PROJECT_020: "완료·보관된 프로젝트는 바꿀 수 없어요.",
  PROJECT_021:
    "새 기간을 벗어나는 할 일·지출·회의록이 있어 기간을 줄일 수 없어요.",
  PROJECT_022: "마일스톤을 찾을 수 없어요. 새로고침한 뒤 다시 시도해 주세요.",
  PROJECT_023: "앞선 마일스톤을 먼저 완료해 주세요.",
  PROJECT_024: "뒤의 마일스톤을 먼저 취소해 주세요.",

  // 할 일 (TASK_)
  TASK_003: "할 일을 찾을 수 없어요. 이미 삭제됐을 수 있어요.",
  TASK_004: "이 할 일을 수정할 권한이 없어요.",
  TASK_005: "작성자만 삭제할 수 있어요.",
  TASK_007: "마감일이 프로젝트 기간을 벗어났어요.",
  TASK_008: "다른 사람에게 배정하려면 프로젝트 오너나 PM이어야 해요.",
  TASK_009: "담당자가 이 프로젝트의 참여자가 아니에요.",
  TASK_010: "개인 할 일에는 담당자를 지정할 수 없어요.",

  // 게시판 (POST_)
  POST_001: "게시글을 찾을 수 없어요. 이미 삭제됐을 수 있어요.",
  POST_002: "이 프로젝트의 게시글이 아니에요.",
  POST_003: "완료·보관된 프로젝트에는 글을 쓸 수 없어요.",
  POST_004: "이 게시글을 수정하거나 삭제할 권한이 없어요.",
  POST_005: "작성자를 찾을 수 없어요.",

  // 회의록 (MEETING_)
  MEETING_001: "작성자를 찾을 수 없어요.",
  MEETING_002: "참석자 중 찾을 수 없는 사용자가 있어요.",
  MEETING_003: "프로젝트를 찾을 수 없어요. 이미 삭제됐을 수 있어요.",
  MEETING_004: "회의록을 찾을 수 없어요. 이미 삭제됐을 수 있어요.",
  MEETING_005: "작성자는 참석자에 넣을 수 없어요.",
  MEETING_006: "참석자가 중복됐어요.",
  MEETING_007: "회의 일자가 프로젝트 기간을 벗어났어요.",
  MEETING_008: "완료·보관된 프로젝트에는 회의록을 쓸 수 없어요.",
  MEETING_009: "이 회의록을 수정하거나 삭제할 권한이 없어요.",
  MEETING_010: "이 프로젝트의 회의록이 아니에요.",
  MEETING_011: "본인은 참석자 명단에서 뺄 수 없어요.",

  // 지출 (EXPENSE_)
  EXPENSE_003: "사용일이 프로젝트 기간을 벗어났어요.",
  EXPENSE_004: "지출 내역을 찾을 수 없어요. 이미 삭제됐을 수 있어요.",
  EXPENSE_005: "본인이 등록한 지출만 수정·삭제할 수 있어요.",
  EXPENSE_006: "이미 삭제된 지출이에요.",

  // 캘린더 (SCHEDULE_ · LEAVE_)
  SCHEDULE_001: "일정을 찾을 수 없어요. 이미 삭제됐을 수 있어요.",
  SCHEDULE_002: "종료 일시는 시작 일시 이후여야 해요.",
  SCHEDULE_003: "본인이 만든 일정만 수정·삭제할 수 있어요.",
  SCHEDULE_004: "조회 종료일은 시작일 이후여야 해요.",
  SCHEDULE_005: "작성자는 일정에서 나갈 수 없어요. 일정을 삭제해 주세요.",
  SCHEDULE_006: "이 일정의 참가자가 아니에요.",
  SCHEDULE_007: "휴가 일정은 휴가에서 수정해 주세요.",
  LEAVE_001: "휴가를 찾을 수 없어요. 이미 삭제됐을 수 있어요.",
  LEAVE_002: "본인이 신청한 휴가만 수정·취소할 수 있어요.",

  // 알림 (NOTIFICATION_)
  NOTIFICATION_001: "알림을 찾을 수 없어요.",

  // 재계획 (REPLAN_)
  REPLAN_001: "재계획을 찾을 수 없어요.",
  REPLAN_002: "고른 시나리오를 찾을 수 없어요.",
  REPLAN_003: "재계획을 적용할 권한이 없어요.",
  REPLAN_004: "계획을 세운 뒤 내용이 바뀌었어요. 재계획을 다시 만들어 주세요.",
  REPLAN_005: "재계획 내용이 올바르지 않아요.",
  REPLAN_006: "이미 적용된 재계획이에요.",

  // 에이전트 (AGENT_) — 실패 안내 옆에 다시 시도 버튼이 붙는 자리가 많아 재촉 문구를 아낀다
  AGENT_001: "내 대화가 아니에요.",
  AGENT_002: "대화를 찾을 수 없어요. 이미 삭제됐을 수 있어요.",
  AGENT_003: "지금은 AI에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.",
  AGENT_004: "진행 중인 요청이 있어요. 끝나기를 기다리거나 먼저 답해 주세요.",
  AGENT_005: "메시지를 찾을 수 없어요.",
  AGENT_006: "이미 처리된 요청이에요.",
  AGENT_007: "요청을 처리하지 못했어요.",
  AGENT_008: "응답이 너무 오래 걸려요. 잠시 후 다시 시도해 주세요.",
  AGENT_009: "화면 정보가 너무 많아요. 다른 화면에서 다시 시도해 주세요.",
  AGENT_010: "실행을 찾을 수 없어요.",
  AGENT_011: "내 실행이 아니에요.",
  AGENT_012: "요청을 찾을 수 없어요. 이미 만료됐을 수 있어요.",
  AGENT_014: "승인 정보가 만료됐어요. 다시 시도해 주세요.",
  AGENT_015: "승인한 내용과 요청 내용이 달라요. 다시 시도해 주세요.",
  AGENT_016: "작업을 이어갈 수 없어요.",
  AGENT_017: "답변이 도중에 끊겼어요.",
  AGENT_018:
    "진행 중인 작업이 너무 많아요. 홈의 '확인이 필요한 요청'을 먼저 정리해 주세요.",
  AGENT_019: "응답 시간이 지났어요.",
  AGENT_020: "요청이 너무 잦아요. 잠시 후 다시 시도해 주세요.",
  AGENT_021: "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
  AGENT_022: "확인할 항목이 너무 많아요. 화면에서 직접 입력해 주세요.",
  AGENT_023: "녹취록이 너무 길어요. 30,000자 이내로 줄여 주세요.",
  AGENT_024: "초안을 만드는 중이에요. 잠시만 기다려 주세요.",
  AGENT_025: "작업이 너무 길어져 중단했어요. 요청을 나눠서 다시 시도해 주세요.",
  AGENT_026: "내용이 너무 길어요. 줄여서 다시 시도해 주세요.",
  AGENT_027: "작업을 취소했어요.",
  AGENT_028: "요약을 만드는 중이에요. 잠시 후 다시 시도해 주세요.",
  AGENT_029: "보낼 수 없는 형식의 파일이에요.",
  AGENT_030: "파일이 너무 커요.",
  AGENT_031: "한 번에 보낼 수 있는 파일 수를 넘었어요.",
  AGENT_032: "파일을 읽지 못했어요. UTF-8로 저장된 파일인지 확인해 주세요.",
  AGENT_033: "회의 기록이 비어 있어요.",
  AGENT_034: "지금은 처리 중인 작업이 많아요. 잠시 후 다시 시도해 주세요.",
};

/** 세션이 끊긴 이유를 서버가 짚어 주는 코드. 이유를 모르는 만료는 여기 없다 — 알릴 것이 없다. */
export const SESSION_END_CODES = ["REQUEST_030", "REQUEST_031", "REQUEST_032"];

/**
 * 코드에 붙는 문장을 찾는다. 표에 없으면 undefined —
 * 부르는 쪽이 그 화면에 맞는 문장으로 대신한다.
 */
export const findErrorMessage = (code: string | null | undefined) =>
  code ? ERROR_MESSAGE[code] : undefined;

/**
 * 코드를 표에서 찾아 화면 문장으로 바꾼다. 못 찾으면 fallback 이다 —
 * 서버 message 는 어떤 경우에도 그대로 내보내지 않는다.
 */
export const toUserMessage = (
  code: string | null | undefined,
  fallback: string,
) => {
  const message = findErrorMessage(code);
  if (message) return message;

  // 서버가 코드를 새로 추가하면 화면은 뭉뚱그린 문장밖에 못 보여준다. 개발 중에만 알린다.
  if (code && process.env.NODE_ENV !== "production") {
    console.warn(`[errorMessage] 문구가 없는 errorCode: ${code}`);
  }

  return fallback;
};

// 사람에게 보여줄 문장이 아니라는 신호들 — 예외 이름·스택·모듈 경로·에러 코드 토큰.
// 서버가 예외를 그대로 실어 보내는 경로가 있어(에이전트 실행 실패) 한 번 거른다.
const TECHNICAL_HINT =
  /[\w$]*(Error|Exception|Interrupt)\b|Traceback|\bat\s[\w$.]+\(|\b[a-z_]+(\.[a-z_]+){2,}\b|[{}<>]|\bNone(Type)?\b|\bnull\b|\bundefined\b/;

const HANGUL = /[가-힣]/;

// "프로젝트를 찾을 수 없습니다. (PROJECT_004)" 처럼 문장에 섞여 오는 코드
const ERROR_CODE_TOKEN = /\s*[([]?\b[A-Z][A-Z0-9]*_\d{2,}\b[)\]]?/g;

/**
 * 코드가 없어 문장밖에 없을 때(에이전트 실행 실패 기록 등) 쓰는 마지막 방어선.
 * 사람이 읽을 문장으로 보이면 코드 토막만 걷어내 돌려주고, 아니면 fallback 이다.
 */
export const toSafeMessage = (
  message: string | null | undefined,
  fallback: string,
) => {
  const text = message?.replace(ERROR_CODE_TOKEN, "").trim();
  if (!text) return fallback;

  return HANGUL.test(text) && !TECHNICAL_HINT.test(text) ? text : fallback;
};
