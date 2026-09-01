// 서버는 문구를 발생 시점에 완성해 한 줄로 내려준다. 맨 앞의 '이름'만 배지로 빼고
// 나머지 문장은 손대지 않는다.
//
// ⚠️ 예전엔 "프로젝트에서" 같은 앞말을 지웠다. 배지에 이름이 이미 있으니 중복이라고 봤는데,
//    배지는 이름일 뿐이라 중복이 아니었고 문장에서 주어만 사라졌다.
//    "'A 프로젝트' / 제외되었습니다" 처럼 무엇에서 빠졌는지 모를 문구가 나온다.
const TITLE_PATTERN = /^'(.+?)'\s*(.*)$/;

export interface NotificationText {
  // 배지에 넣을 이름. 문구에서 못 찾으면 null
  subject: string | null;
  body: string;
}

export const splitNotificationTitle = (title: string): NotificationText => {
  const matched = TITLE_PATTERN.exec(title);
  if (!matched) return { subject: null, body: title };

  const [, subject, rest] = matched;
  const body = rest.trim();

  // 이름만 있고 남는 말이 없으면 쪼갤 이유가 없다
  return body ? { subject, body } : { subject: null, body: title };
};
