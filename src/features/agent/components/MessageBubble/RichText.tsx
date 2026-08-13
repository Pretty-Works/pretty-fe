import { Fragment } from "react";

import { parseInline, parseRichText, type Inline } from "./parseRichText";

import styles from "./RichText.module.css";

interface RichTextProps {
  text: string;
}

function renderLine(parts: Inline[]) {
  return parts.map((part, index) =>
    part.bold ? (
      <strong key={index}>{part.text}</strong>
    ) : (
      <Fragment key={index}>{part.text}</Fragment>
    ),
  );
}

/** 제목·버튼처럼 블록 요소를 넣을 수 없는 자리에서도 답변과 같은 굵게 규칙을 쓴다. */
export function InlineRichText({ text }: RichTextProps) {
  return (
    <span className={styles.inline}>
      {text.split("\n").map((line, index) => (
        <Fragment key={index}>
          {index > 0 && <br />}
          {renderLine(parseInline(line))}
        </Fragment>
      ))}
    </span>
  );
}

export default function RichText({ text }: RichTextProps) {
  const blocks = parseRichText(text);

  return (
    <div className={styles.root}>
      {blocks.map((block, index) => {
        if (block.kind === "list") {
          const List = block.ordered ? "ol" : "ul";

          return (
            <List key={index} className={styles.list}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderLine(item)}</li>
              ))}
            </List>
          );
        }

        return (
          <p key={index} className={styles.paragraph}>
            {/* 문단 안쪽의 줄바꿈은 그대로 살린다 — 문단 사이보다 좁게 벌어진다 */}
            {block.lines.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {lineIndex > 0 && <br />}
                {renderLine(line)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
