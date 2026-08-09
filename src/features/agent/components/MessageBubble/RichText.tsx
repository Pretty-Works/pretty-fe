import type { ReactNode } from "react";

// 에이전트 답변에 섞여 오는 **굵게** 표기만 살린다.
// 줄바꿈을 건너뛰지 않으므로 닫히지 않은 **는 별표 그대로 남는다
const BOLD = /\*\*(.+?)\*\*/g;

interface RichTextProps {
  text: string;
}

export default function RichText({ text }: RichTextProps) {
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(BOLD)) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    nodes.push(<strong key={match.index}>{match[1]}</strong>);
    cursor = match.index + match[0].length;
  }
  nodes.push(text.slice(cursor));

  return <>{nodes}</>;
}
