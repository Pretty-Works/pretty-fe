// 화면이 들고 있는 폼 값 → 에이전트에 실어 보낼 형태로 줄이기.
//
// screenContext 는 BE 가 열어보지 않고 그대로 에이전트로 넘기지만 크기 상한이 있다
// (32KB, 넘으면 AGENT_009 로 요청 자체가 거절된다). 회의록 '주요 내용' 한 칸이 혼자
// 그 상한을 넘길 수 있어 보내기 전에 여기서 줄인다.
//
// 줄이는 목적은 "어느 칸이 채워져 있는지"를 알리는 것이다 — 원문을 넘기는 자리가 아니다.
// 그래서 빈 값도 지우지 않는다. 빈 칸이라는 사실이 곧 "이건 물어봐야 한다"는 정보다.

/** 문자열 한 칸의 상한. 넘으면 앞부분만 남기고 몇 자였는지 덧붙인다 */
const MAX_TEXT = 500;

/** 배열 한 칸의 상한(참여자·마일스톤). 넘으면 앞에서 자르고 몇 개가 더 있었는지 남긴다 */
const MAX_ITEMS = 20;

/** 다 줄인 뒤의 상한(byte). 서버 상한(32KB)보다 넉넉히 낮게 잡아 토큰도 함께 아낀다 */
const MAX_BYTES = 8000;

const OMITTED = "(내용이 길어 생략)";

const byteLength = (value: unknown) =>
  new TextEncoder().encode(JSON.stringify(value) ?? "").length;

const shrink = (value: unknown): unknown => {
  if (typeof value === "string") {
    return value.length > MAX_TEXT
      ? `${value.slice(0, MAX_TEXT)}…(총 ${value.length}자)`
      : value;
  }

  if (Array.isArray(value)) {
    const items = value.slice(0, MAX_ITEMS).map(shrink);

    return value.length > MAX_ITEMS
      ? [...items, `…외 ${value.length - MAX_ITEMS}개`]
      : items;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        shrink(item),
      ]),
    );
  }

  return value;
};

/**
 * 폼 값 한 벌을 screenContext.formState 에 실을 수 있는 크기로 줄인다.
 *
 * 칸마다 줄여도 상한을 넘으면 큰 칸부터 값을 버린다 — 키는 남긴다.
 * 무엇이 있었는지까지 사라지면 에이전트가 이미 채운 칸을 다시 묻는다.
 */
export const compactFormState = (
  values: Record<string, unknown>,
): Record<string, unknown> => {
  let compacted: Record<string, unknown>;

  try {
    compacted = shrink(values) as Record<string, unknown>;
    if (byteLength(compacted) <= MAX_BYTES) return compacted;
  } catch {
    // JSON 으로 만들 수 없는 값(순환 참조·File 등)이 섞이면 통째로 포기한다.
    // 화면 문맥은 있으면 좋은 것이지 메시지 전송을 막을 이유가 아니다.
    return {};
  }

  const biggestFirst = Object.entries(compacted).sort(
    ([, a], [, b]) => byteLength(b) - byteLength(a),
  );

  for (const [key] of biggestFirst) {
    if (byteLength(compacted) <= MAX_BYTES) break;
    compacted[key] = OMITTED;
  }

  return compacted;
};
