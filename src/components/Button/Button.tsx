import { cx } from "@/lib/cx";

import styles from "./Button.module.css";

export type ButtonType = "primary" | "danger" | "light" | "dark";
export type ButtonStyle = "fill" | "weak";
export type ButtonSize = "big" | "large" | "medium" | "tiny";
export type ButtonDisplay = "block" | "full";

export interface ButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> {
  children?: React.ReactNode;
  type?: ButtonType;
  buttonStyle?: ButtonStyle;
  size?: ButtonSize;
  display?: ButtonDisplay;
  loading?: boolean;
  leftAccessory?: React.ReactNode;
  htmlType?: "button" | "submit" | "reset";
}

export default function Button({
  children,
  type = "primary",
  buttonStyle = "fill",
  size = "big",
  display = "block",
  loading = false,
  leftAccessory,
  htmlType = "button",
  className,
  disabled,
  ...rest
}: ButtonProps) {
  const classes = cx(
    styles.button,
    styles[type],
    styles[buttonStyle],
    styles[size],
    display === "full" && styles.full,
    className,
  );

  return (
    <button
      type={htmlType}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : (
        leftAccessory && (
          <span className={styles.accessory}>{leftAccessory}</span>
        )
      )}

      {children}
    </button>
  );
}
