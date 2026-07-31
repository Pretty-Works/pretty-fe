"use client";

import RobotIcon from "@/assets/icons/calendar/ai-robot.svg";

import styles from "./AiScheduleButton.module.css";

interface AiScheduleButtonProps {
  onClick?: () => void;
}

export default function AiScheduleButton({ onClick }: AiScheduleButtonProps) {
  return (
    <button type="button" className={styles.button} onClick={onClick}>
      <span className={styles.iconBox} aria-hidden="true">
        <RobotIcon width={18} height={18} />
      </span>
      AI로 일정 잡기
    </button>
  );
}
