/** 1MB가 안 되는 파일이 대부분이라 MB로만 적으면 전부 0.0MB가 된다 */
export const formatFileSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))}KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)}MB`;

/** 받침 유무에 따라 조사를 고른다. ("설명" → 설명은 · "사용처" → 사용처는) */
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
