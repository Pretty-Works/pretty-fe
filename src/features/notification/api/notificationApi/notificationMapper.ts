import { splitNotificationTitle } from "../../utils/notificationText/notificationText";

import type {
  AppNotification,
  ServerNotification,
} from "./notificationApi.types.ts";

// 일정 알림에는 배지로 쓸 프로젝트가 없다(일정은 프로젝트에 속하지 않는다).
// BE 문구도 따옴표로 시작하지 않아 파싱이 그냥 실패하고 문구 전체가 본문으로 남는데,
// 그 위에 종류를 알려주는 라벨만 화면이 붙인다.
const SCHEDULE_BADGE = "일정";

export const toAppNotification = (
  notification: ServerNotification,
): AppNotification => {
  const text = splitNotificationTitle(notification.title);
  const isSchedule = notification.type.startsWith("SCHEDULE_");

  return {
    id: String(notification.notificationId),
    type: notification.type,
    title: notification.title,
    subject: isSchedule ? SCHEDULE_BADGE : text.subject,
    body: text.body,
    target: notification.target,
    read: notification.read,
    createdAt: notification.createdAt,
  };
};
