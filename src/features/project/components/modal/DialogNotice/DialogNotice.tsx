import styles from "./DialogNotice.module.css";

interface DialogNoticeProps {
  tone?: "warn" | "ok";
  children: React.ReactNode;
}

export default function DialogNotice({
  tone = "warn",
  children,
}: DialogNoticeProps) {
  return (
    <div className={styles.body}>
      <span
        className={`${styles.icon} ${tone === "ok" ? styles.ok : styles.warn}`}
        aria-hidden="true"
      >
        {tone === "ok" ? "✓" : "!"}
      </span>
      <p className={styles.text}>{children}</p>
    </div>
  );
}
