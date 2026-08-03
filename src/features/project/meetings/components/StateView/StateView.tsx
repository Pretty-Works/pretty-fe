import Button from "@/components/Button/Button";

import styles from "./StateView.module.css";

interface StateAction {
  label: string;
  onClick?: () => void;
  /** 버튼 스타일 */
  variant?: "primary" | "outline";
}

interface StateViewProps {
  icon?: React.ReactNode;
  /** 배지 톤 */
  tone?: "default" | "error";
  title: string;
  description?: React.ReactNode;
  action?: StateAction;
}

// 공통 상태 화면 (빈 목록 · 검색 없음 · 오류)
export default function StateView({
  icon,
  tone = "default",
  title,
  description,
  action,
}: StateViewProps) {
  return (
    <div className={styles.wrap} role="status">
      {icon && (
        <div
          className={`${styles.badge} ${tone === "error" ? styles.error : ""}`}
        >
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        </div>
      )}

      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.desc}>{description}</p>}

      {action && (
        <div className={styles.cta}>
          <Button
            name={action.label}
            status={action.variant === "outline" ? "cancel" : "primary"}
            size="sm"
            onClick={action.onClick}
          />
        </div>
      )}
    </div>
  );
}
