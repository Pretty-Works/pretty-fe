import { cx } from "@/lib/cx";

import styles from "./StateView.module.css";

/** 여백 크기 — 팝오버 compact · 패널 default · 페이지 roomy */
type StateViewSize = "compact" | "default" | "roomy";

interface StateViewProps {
  /** 첫 조회 중 */
  loading?: boolean;
  /** 조회 실패 — 데이터가 비어 있으면 안 되는 화면은 `isError || !data`로 함께 넘긴다 */
  error?: boolean;
  /** 조회는 됐지만 보여줄 게 없음 */
  empty?: boolean;

  loadingText?: string;
  errorText?: string;
  emptyText?: string;

  size?: StateViewSize;
  /**
   * 에러일 때 문구 아래에 쌓을 버튼.
   * default·roomy 는 화면 단위 실패라 문구까지 키우고, compact 는 팝오버 안이라 크기를 그대로 둔다.
   */
  action?: React.ReactNode;

  children?: React.ReactNode;
}

const SIZE_CLASS: Record<StateViewSize, string> = {
  compact: styles.compact,
  default: "",
  roomy: styles.roomy,
};

function Message({
  text,
  size,
  isError = false,
}: {
  text: string;
  size: StateViewSize;
  isError?: boolean;
}) {
  return (
    <p
      className={cx(styles.message, SIZE_CLASS[size], isError && styles.error)}
      role={isError ? "alert" : "status"}
    >
      {text}
    </p>
  );
}

/** 목록·카드의 로딩 / 실패 / 빈 상태를 한곳에서 그린다. */
export default function StateView({
  loading = false,
  error = false,
  empty = false,
  loadingText = "불러오는 중이에요…",
  errorText = "불러오지 못했어요.",
  emptyText = "표시할 내용이 없어요.",
  size = "default",
  action,
  children,
}: StateViewProps) {
  if (loading) return <Message text={loadingText} size={size} />;

  if (error) {
    const message = <Message text={errorText} size={size} isError />;

    if (!action) return message;

    return (
      <div className={cx(styles.block, SIZE_CLASS[size])}>
        {message}
        {action}
      </div>
    );
  }

  if (empty) return <Message text={emptyText} size={size} />;

  return <>{children}</>;
}
