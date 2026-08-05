/**
 * 받침 유무에 따라 조사를 고른다. ("설명" → 설명은 · "사용처" → 사용처는)
 *
 * 문구를 코드로 조립할 때만 쓴다. 고정 문구는 그냥 직접 쓰는 게 읽기 좋다.
 */
export const withJosa = (
  word: string,
  withFinal: string,
  withoutFinal: string,
) => {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0);

  // 한글 음절이 아니면(영문·숫자·기호) 받침을 알 수 없어 받침 없는 쪽을 쓴다
  if (code < 0xac00 || code > 0xd7a3) return `${word}${withoutFinal}`;

  return `${word}${(code - 0xac00) % 28 ? withFinal : withoutFinal}`;
};
