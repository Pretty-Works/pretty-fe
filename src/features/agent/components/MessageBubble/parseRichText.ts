/**
 * 에이전트 답변을 문단·목록 단위로 끊는다.
 *
 * 답변은 마크다운 문서가 아니다 — 서버 공통 규칙이 "한두 문장으로 결과만 보고"라
 * 대부분 한 문단이고, 길어질 때 섞여 오는 것도 굵게·불릿·번호 정도다.
 * 그래서 제목·인용·코드블록·중첩 목록은 일부러 다루지 않는다.
 * 없는 문법을 넣어 두면 답변에 우연히 들어간 기호가 서식으로 둔갑한다.
 */

/** 한 줄을 이루는 조각. 굵게인지 아닌지만 구분한다 */
export interface Inline {
  text: string;
  bold: boolean;
}

export type Block =
  /** 빈 줄로 끊기는 덩어리. 안쪽의 줄바꿈은 lines 로 남는다 */
  | { kind: "paragraph"; lines: Inline[][] }
  | { kind: "list"; ordered: boolean; items: Inline[][] };

// 닫히지 않은 ** 는 별표 그대로 남긴다 — 답변에 우연히 들어간 별표를 삼키지 않는다.
// 줄 단위로만 돌려서 여러 줄에 걸친 ** 는 매치되지 않는다.
const BOLD = /\*\*(.+?)\*\*/g;

const BULLET = /^\s*[-*·•]\s+(.*)$/;
const ORDERED = /^\s*\d+[.)]\s+(.*)$/;

/** "앞 **가운데** 뒤" → 조각 셋 */
export function parseInline(line: string): Inline[] {
  const parts: Inline[] = [];
  let cursor = 0;

  for (const match of line.matchAll(BOLD)) {
    if (match.index > cursor) {
      parts.push({ text: line.slice(cursor, match.index), bold: false });
    }
    parts.push({ text: match[1], bold: true });
    cursor = match.index + match[0].length;
  }

  if (cursor < line.length) {
    parts.push({ text: line.slice(cursor), bold: false });
  }

  return parts;
}

export function parseRichText(text: string): Block[] {
  const blocks: Block[] = [];
  // 아직 닫히지 않은 덩어리. 종류가 바뀌거나 빈 줄을 만나면 밀어 넣는다
  let paragraph: Inline[][] = [];
  let items: Inline[][] = [];
  let ordered = false;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({ kind: "paragraph", lines: paragraph });
    paragraph = [];
  };

  const flushList = () => {
    if (items.length === 0) return;
    blocks.push({ kind: "list", ordered, items });
    items = [];
  };

  for (const raw of text.split("\n")) {
    // 빈 줄은 그 자체로 경계다. 여기서만 문단이 갈린다
    if (raw.trim() === "") {
      flushParagraph();
      flushList();
      continue;
    }

    const bullet = raw.match(BULLET);
    const numbered = raw.match(ORDERED);

    if (bullet || numbered) {
      const nextOrdered = numbered !== null;
      // 글머리 종류가 바뀌면 다른 목록이다 — 이어 붙이면 번호가 이상해진다
      if (items.length > 0 && ordered !== nextOrdered) flushList();

      flushParagraph();
      ordered = nextOrdered;
      items.push(parseInline((numbered ?? bullet)![1]));
      continue;
    }

    // 목록 뒤에 그냥 문장이 오면 목록은 거기서 끝난다
    flushList();
    paragraph.push(parseInline(raw));
  }

  flushParagraph();
  flushList();

  return blocks;
}
