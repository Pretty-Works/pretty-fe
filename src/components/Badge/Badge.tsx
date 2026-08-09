import { cx } from "@/lib/cx";

import styles from "./Badge.module.css";

export type BadgeType =
  "blue" | "teal" | "green" | "red" | "yellow" | "elephant" | "purple";
export type BadgeStyle = "fill" | "weak";
export type BadgeSize = "large" | "medium" | "small" | "tiny";

interface BadgeProps {
  /** 글자만이 아니라 점·아이콘을 함께 넣을 수 있다 */
  children: React.ReactNode;
  type?: BadgeType;
  badgeStyle?: BadgeStyle;
  size?: BadgeSize;
  className?: string;
}

export default function Badge({
  children,
  type = "blue",
  badgeStyle = "fill",
  size = "small",
  className,
}: BadgeProps) {
  return (
    <span
      className={cx(
        styles.badge,
        styles[type],
        styles[badgeStyle],
        styles[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
