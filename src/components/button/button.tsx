import styles from "./Button.module.css";

export type ButtonStatus =
    | "primary"
    | "cancel"
    | "edit"
    | "delete"
    | "agent";

export type ButtonUI = "filled" | "gray" | "red";

export interface ButtonProps
    extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "name"> {
    name?: string;
    status?: ButtonStatus;
    ui?: ButtonUI;
    hasPlus?: boolean;
    icon?: React.ReactNode;
}

function statusToUI(status: ButtonStatus): ButtonUI {
    switch (status) {
        case "primary":
        case "agent":
            return "filled";

        case "cancel":
        case "edit":
            return "gray";

        case "delete":
            return "red";
    }
}

export default function Button({
    name,
    status = "primary",
    ui,
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