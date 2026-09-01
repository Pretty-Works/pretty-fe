"use client";

import Result from "@/components/Result/Result";

const STATUS_MESSAGE: Record<
  number,
  { title: string; subtitle: string; mark: string }
> = {
  400: {
    title: "입력한 정보를 다시 확인해 주세요",
    subtitle: "입력하신 내용에 문제가 있어요. 다시 확인한 뒤 시도해 주세요.",
    mark: "⚠️",
  },
  403: {
    title: "접근 권한이 없어요",
    subtitle: "이 화면을 볼 수 있는 권한이 없어요. 담당자에게 문의해 주세요.",
    mark: "🔒",
  },
  404: {
    title: "페이지를 찾을 수 없어요",
    subtitle: "주소가 잘못되었거나, 삭제된 페이지일 수 있어요.",
    mark: "🔍",
  },
  500: {
    title: "화면을 표시하는 중 문제가 생겼어요",
    subtitle:
      "일시적인 오류일 수 있어요. 다시 시도해도 반복되면 관리자에게 알려주세요.",
    mark: "⚠️",
  },
};

const DEFAULT_STATUS = 500;

interface ErrorPageProps {
  statusCode?: number;
  title?: string;
  subtitle?: string;
  onRightButtonClick?: () => void;
  onLeftButtonClick?: () => void;
  children?: React.ReactNode;
}

export default function ErrorPage({
  statusCode = DEFAULT_STATUS,
  title,
  subtitle,
  onRightButtonClick,
  onLeftButtonClick,
  children,
}: ErrorPageProps) {
  const preset = STATUS_MESSAGE[statusCode] ?? STATUS_MESSAGE[DEFAULT_STATUS];

  const rightLabel =
    statusCode === 404 || (statusCode === 403 && !onLeftButtonClick)
      ? "홈으로"
      : "다시 시도";

  return (
    <>
      <Result
        size="page"
        figure={<Result.Figure tone="error">{preset.mark}</Result.Figure>}
        title={title ?? preset.title}
        description={subtitle ?? preset.subtitle}
        button={
          (onLeftButtonClick || onRightButtonClick) && (
            <>
              {onLeftButtonClick && (
                <Result.Button
                  type="light"
                  buttonStyle="weak"
                  onClick={onLeftButtonClick}
                >
                  홈으로
                </Result.Button>
              )}
              {onRightButtonClick && (
                <Result.Button onClick={onRightButtonClick}>
                  {rightLabel}
                </Result.Button>
              )}
            </>
          )
        }
      />

      {children}
    </>
  );
}
