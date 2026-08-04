"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <html lang="ko">
      <body
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: "12px",
          fontFamily: "'Noto Sans KR', sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <h1 style={{ fontSize: "17px", color: "#191f28" }}>
          서비스에 문제가 생겼어요
        </h1>
        <p style={{ fontSize: "13px", color: "#3c3f48" }}>
          잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 알려주세요.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "8px",
            height: "36px",
            padding: "0 16px",
            border: "1px solid #7c3aed",
            borderRadius: "9px",
            background: "#7c3aed",
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
