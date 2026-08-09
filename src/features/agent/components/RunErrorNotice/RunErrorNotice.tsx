"use client";

import { LuRefreshCw, LuTriangleAlert } from "react-icons/lu";

import Button from "@/components/Button/Button";

import styles from "./RunErrorNotice.module.css";

interface RunErrorNoticeProps {
  /** 실패 사유. 서버가 알려준 문장이 있으면 그대로 온다 */
  message: string;
  onRetry: () => void;
}

/** 실행이 실패했을 때 답변 자리에 뜨는 안내 줄. */
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
