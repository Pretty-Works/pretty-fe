import assert from "node:assert/strict";
import test from "node:test";

import { splitNotificationTitle } from "./notificationText.ts";

// BE NotificationType의 문구 템플릿에 실제 값을 채운 것.
// (pretty-be: notification/constant/NotificationType.java)
// 템플릿이 바뀌면 여기도 함께 고칠 것 — 이 목록이 화면에 뜨는 문장 전부다.
const TITLES = {
  PROJECT_MEMBER_ADDED: "'레거시 jQuery 코드 제거' 프로젝트에 참여자로 추가되었습니다",
  PROJECT_MEMBER_REMOVED: "'레거시 jQuery 코드 제거' 프로젝트에서 제외되었습니다",
  PROJECT_STATUS_CHANGED: "'사내 포털' 프로젝트가 진행중 상태로 변경되었습니다",
  PROJECT_PERIOD_CHANGED:
    "'사내 포털' 프로젝트 기간이 2026-08-01 ~ 2026-12-31 로 변경되었습니다",
  MILESTONE_COMPLETED: "'1차 배포' 마일스톤이 완료되었습니다",
  EXPENSE_CREATED: "'사내 포털' 프로젝트에 320,000원 지출이 등록되었습니다",
  // 할 일 3종은 "첫 인자 = 프로젝트명, 마지막 = 할 일 내용" 규칙으로 통일돼 있다.
  TASK_ASSIGNED: "'사내 포털' 프로젝트에 할 일이 배정되었습니다: 로그인 화면 QA",
  TASK_DELETED: "'사내 포털' 프로젝트에서 할 일이 삭제되었습니다: 로그인 화면 QA",
  TASK_DUE_DATE_CHANGED:
    "'사내 포털' 프로젝트의 할 일 마감일이 2026-08-20 로 변경되었습니다: 로그인 화면 QA",
  POST_CREATED: "'사내 포털' 프로젝트에 중요 게시글이 등록되었습니다: 배포 일정 공지",
  POST_UPDATED: "'배포 일정 공지' 게시글이 수정되었습니다",
  MEETING_CREATED: "'사내 포털' 프로젝트에 회의록이 등록되었습니다: 8월 2주차 정기회의",
  SCHEDULE_PARTICIPANT_ADDED: "'주간 회의' 일정에 참가자로 추가되었습니다",
  SCHEDULE_PARTICIPANT_REMOVED: "'주간 회의' 일정에서 제외되었습니다",
  SCHEDULE_TIME_CHANGED:
    "'주간 회의' 일정 시간이 2026-08-11 14:00 ~ 2026-08-11 15:00 로 변경되었습니다",
  SCHEDULE_DELETED: "'주간 회의' 일정이 삭제되었습니다",
};

test("이름은 배지로 빠지고 문장은 그대로 남는다", () => {
  assert.deepEqual(splitNotificationTitle(TITLES.PROJECT_MEMBER_ADDED), {
    subject: "레거시 jQuery 코드 제거",
    body: "프로젝트에 참여자로 추가되었습니다",
  });
});

// 예전엔 "프로젝트에서"를 지워 본문이 "제외되었습니다"만 남았다.
// 배지에는 이름밖에 없어서 무엇에서 빠졌는지 알 수 없는 문구가 됐다.
test("무엇에서 빠졌는지가 본문에 남는다", () => {
  const { body } = splitNotificationTitle(TITLES.PROJECT_MEMBER_REMOVED);

  assert.equal(body, "프로젝트에서 제외되었습니다");
});

test("일정 알림도 같은 규칙으로 읽힌다", () => {
  assert.deepEqual(splitNotificationTitle(TITLES.SCHEDULE_PARTICIPANT_REMOVED), {
    subject: "주간 회의",
    body: "일정에서 제외되었습니다",
  });
});

// 앞의 이름만 떼고 나머지는 한 글자도 건드리지 않는다 = 본문은 항상 원문의 꼬리다.
// 문장 중간에서 말을 지우면(예전 "프로젝트에서" 제거) 이 조건이 깨진다.
test("모든 알림 문구가 배지와 잘리지 않은 본문으로 갈린다", () => {
  for (const [type, title] of Object.entries(TITLES)) {
    const { subject, body } = splitNotificationTitle(title);

    assert.ok(subject, `${type}: 배지에 넣을 이름을 못 찾았다`);
    assert.ok(!body.startsWith("'"), `${type}: 이름이 본문에 남았다`);
    assert.ok(
      title.endsWith(body),
      `${type}: 본문에서 말이 잘려 나갔다 — "${body}"`,
    );
  }
});

// 이름 앞에 말이 붙은 문구. 지금 BE 템플릿엔 없지만(예전 TASK_DELETED가 이 꼴이었다)
// 새 문구가 이렇게 들어와도 배지 없이 한 줄로 나올 뿐 깨지지 않아야 한다.
test("따옴표로 시작하지 않는 문구는 통째로 본문이 된다", () => {
  const title = "배정된 '로그인 화면 QA' 할 일이 삭제되었습니다";

  assert.deepEqual(splitNotificationTitle(title), {
    subject: null,
    body: title,
  });
});

// BE가 문장을 먼저 만들고 통째로 잘라내던 시절의 행. 닫는 따옴표가 날아가 있다.
// 지금은 이름을 70자로 줄인 뒤 문장을 만들어 이런 문구가 새로 생기지는 않지만,
// 옛 알림이 보관 기간(90일) 동안 그대로 내려온다.
test("닫는 따옴표가 잘려나간 옛 문구도 한 줄로 보여준다", () => {
  const title = "'프론트엔드 컴포넌트 라이브러리 전면 재작성 및 디자인 시스템 정비 프로";

  assert.deepEqual(splitNotificationTitle(title), {
    subject: null,
    body: title,
  });
});

test("형식을 모르는 문구가 와도 그대로 보여준다", () => {
  assert.deepEqual(splitNotificationTitle("새로운 종류의 알림입니다"), {
    subject: null,
    body: "새로운 종류의 알림입니다",
  });
});

// 이름만 있고 남는 말이 없으면 배지로 빼 봐야 본문이 빈다
test("이름뿐인 문구는 쪼개지 않는다", () => {
  assert.deepEqual(splitNotificationTitle("'사내 포털'"), {
    subject: null,
    body: "'사내 포털'",
  });
});
