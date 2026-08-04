import styles from "./Badge.module.css";

export type BadgeType =
  | "blue"
  | "teal"
  | "green"
  | "red"
  | "yellow"
  | "elephant"
  | "purple";
export type BadgeStyle = "fill" | "weak";
export type BadgeSize = "large" | "medium" | "small" | "tiny";

interface BadgeProps {
  children: string | number;
  type?: BadgeType;
  badgeStyle?: BadgeStyle;
  size?: BadgeSize;
}

export default function Badge({
  children,
  type = "blue",
  badgeStyle = "fill",
  size = "small",
}: BadgeProps) {
  return (
    <span
      className={[styles.badge, styles[type], styles[badgeStyle], styles[size]]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
