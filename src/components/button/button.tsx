import styles from "./Button.module.css";

export type ButtonStatus =
  | "primary"
  | "cancel"
  | "edit"
  | "delete"
  | "agent";

// filled: 채움(보라) · outline: 흰 배경+테두리 · soft: 연회색 채움 · tonal: 연보라 채움 · red: 삭제
export type ButtonUI = "filled" | "outline" | "soft" | "tonal" | "gray" | "red";

export type ButtonSize = "xs" | "sm" | "md";

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "name"> {
  name?: string;
  status?: ButtonStatus;
  ui?: ButtonUI;
  size?: ButtonSize;
  hasPlus?: boolean;
  icon?: React.ReactNode;
}

function statusToUI(status: ButtonStatus): ButtonUI {
  switch (status) {
    case "primary":
    case "agent":
      return "filled";
    case "cancel":
      return "outline";
    case "edit":
      return "soft";
    case "delete":
      return "red";
  }
}

export default function Button({
  name,
  status = "primary",
  ui,
  size = "md",
  hasPlus = false,
  icon,
  className,
  ...rest
}: ButtonProps) {
  const isAgent = status === "agent";
  const variant = ui ?? statusToUI(status);

  const classes = [
    styles.button,
    styles[variant],
    size !== "md" && styles[size],
    isAgent && styles.agent,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={classes} {...rest}>
      {hasPlus && (
        <span className={styles.plus} aria-hidden="true">
          +
        </span>
      )}

      {icon}

      {name && <span>{name}</span>}
    </button>
  );
}
