import { cx } from "@/lib/cx";

import Button, { type ButtonProps } from "@/components/Button/Button";

import styles from "./Result.module.css";

interface ResultProps {
  figure?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  button?: React.ReactNode;
  size?: "block" | "page";
}

function ResultRoot({
  figure,
  title,
  description,
  button,
  size = "block",
}: ResultProps) {
  const Root = size === "page" ? "main" : "div";
  const Title = size === "page" ? "h1" : "h3";

  return (
    <Root
      className={cx(styles.result, size === "page" && styles.page)}
      role={size === "block" ? "status" : undefined}
    >
      {figure}

      <Title className={styles.title}>{title}</Title>
      {description && <p className={styles.description}>{description}</p>}

      {button && <div className={styles.buttons}>{button}</div>}
    </Root>
  );
}

function ResultFigure({
  tone = "default",
  children,
}: {
  tone?: "default" | "error";
  children: React.ReactNode;
}) {
  return (
    <div className={cx(styles.figure, tone === "error" && styles.figureError)}>
      <span className={styles.figureMark} aria-hidden="true">
        {children}
      </span>
    </div>
  );
}

function ResultButton({ size = "medium", ...rest }: ButtonProps) {
  return <Button size={size} {...rest} />;
}

const Result = Object.assign(ResultRoot, {
  Figure: ResultFigure,
  Button: ResultButton,
});

export default Result;
