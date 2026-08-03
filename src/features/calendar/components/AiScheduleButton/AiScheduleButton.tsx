import styles from "./AiScheduleButton.module.css";

interface AiScheduleButtonProps {
  onClick?: () => void;
}

export default function AiScheduleButton({ onClick }: AiScheduleButtonProps) {
  return (
    <button type="button" className={styles.button} onClick={onClick}>
      AI와 함께 참여자 일정을 고려해 일정을 잡을 수 있어요 →
    </button>
  );
}
