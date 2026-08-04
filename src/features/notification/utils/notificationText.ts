// 서버는 문구를 발생 시점에 완성해 한 줄로 내려준다.
//   "'그룹웨어 AI 고도화' 프로젝트에 참여자로 추가되었습니다"
// 화면은 앞의 이름만 배지로 띄우고 나머지를 아랫줄에 두므로 여기서 쪼갠다.
//
// ⚠️ 서버의 문구 템플릿(NotificationType)에 기대는 파싱이다.
//    템플릿이 바뀌면 쪼개지지 않고 전체 문구가 본문으로 떨어진다(화면이 비지는 않는다).
//    쪼갠 값을 서버가 따로 내려주면 이 파일은 사라진다.
const TITLE_PATTERN = /^'(.+?)'\s*(.*)$/;

// 이름을 배지로 빼고 나면 "프로젝트에 ~"는 같은 말을 두 번 하는 셈이다.
// 마일스톤 알림은 배지가 프로젝트명이 아니라 마일스톤 목표라 "마일스톤이"를 남긴다.
const REDUNDANT_PREFIX = /^프로젝트(에서|에|가|\s)\s*/;

export interface NotificationText {
  // 배지에 넣을 이름. 문구에서 못 찾으면 null
  subject: string | null;
  body: string;
}

export const splitNotificationTitle = (title: string): NotificationText => {
  const matched = TITLE_PATTERN.exec(title);
  if (!matched) return { subject: null, body: title };

  const [, subject, rest] = matched;
  const body = rest.replace(REDUNDANT_PREFIX, "").trim();

  // 이름만 있고 남는 말이 없으면 쪼갤 이유가 없다
  return body ? { subject, body } : { subject: null, body: title };
};
