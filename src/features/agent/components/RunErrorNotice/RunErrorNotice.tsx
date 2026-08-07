"use client";

import { LuRefreshCw, LuTriangleAlert } from "react-icons/lu";

import Button from "@/components/Button/Button";

import styles from "./RunErrorNotice.module.css";

interface RunErrorNoticeProps {
  /** 실패 사유. 서버가 알려준 문장이 있으면 그대로 온다 */
  message: string;
  onRetry: () => void;
}

/**
 * 실행이 실패했을 때 답변 자리에 뜨는 안내 줄.
 *
 * 실패는 답변이 아니라서 말풍선으로 쌓지 않는다 — 쌓아 두면 대화에 남는 것처럼 보이는데
 * 새로 고치면 없어지고, 무엇보다 사용자가 할 수 있는 일(다시 보내기)을 손수 하게 만든다.
 * 그래서 문구 대신 버튼을 준다. 보낸 말풍선은 위에 그대로 있으니 문장을 다시 칠 필요가 없다.
 */
export default function RunErrorNotice({
  message,
  onRetry,
}: RunErrorNoticeProps) {
  return (
    <div className={styles.notice} role="alert">
      <LuTriangleAlert className={styles.icon} size={15} aria-hidden="true" />

      <p className={styles.text}>{message}</p>

      <Button
        type="light"
        buttonStyle="weak"
        size="tiny"
        className={styles.retry}
        leftAccessory={<LuRefreshCw size={13} />}
        onClick={onRetry}
      >
        다시 시도
      </Button>
    </div>
  );
}
