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
      className={[styles.message, SIZE_CLASS[size], isError && styles.error]
        .filter(Boolean)
        .join(" ")}
      role={isError ? "alert" : "status"}
    >
      {text}
    </p>
  );
}

/**
 * 목록·카드의 로딩 / 실패 / 빈 상태를 한곳에서 그린다.
 *
 * 화면마다 같은 3단 분기를 손으로 쓰다 보니 문구 톤과 여백이 조금씩 어긋났다.
 * 순서(로딩 → 실패 → 비어 있음)를 여기 가둬 두고, 화면은 문구만 넘긴다.
 *
 * 실패했는데 다시 시도할 방법이 있으면 `action`에 버튼을 준다.
 * 그림·설명까지 갖춘 큰 안내가 필요하면 이 컴포넌트가 아니라 `Result`를 쓴다.
 */
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
      <div
        className={[styles.block, SIZE_CLASS[size]].filter(Boolean).join(" ")}
      >
        {message}
        {action}
      </div>
    );
  }

  if (empty) return <Message text={emptyText} size={size} />;

  return <>{children}</>;
}
