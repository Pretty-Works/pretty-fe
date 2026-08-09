const SMALL_UNITS = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
const TEN_UNITS = ["", "십", "백", "천"];
const BIG_UNITS = ["", "만", "억", "조"];

// "120000000" → 일억 이천만 원.
// 숫자가 아니라 입력 문자열을 그대로 받는다 — Number로 바꾸면 안전 정수를 넘길 때 자릿수가
// 어긋나고, 21자리부터는 지수 표기(1e+21)가 돼 한 글자씩 읽을 수 없다.
export function koreanMoney(digits: string) {
  const reversed = digits.split("").reverse();
  const chunks: string[] = [];

  for (let i = 0; i < reversed.length; i += 4) {
    const chunk = reversed.slice(i, i + 4);
    let text = "";

    chunk.forEach((digit, index) => {
      const n = Number(digit);
      if (n === 0) return;
      text = `${SMALL_UNITS[n]}${TEN_UNITS[index]}${text}`;
    });

    if (text) chunks.push(`${text}${BIG_UNITS[i / 4]}`);
  }

  if (chunks.length === 0) return "";

  return `${chunks.reverse().join(" ")} 원`;
}

// 1234567 → 1,234,567
export const withComma = (value: string) =>
  value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// 기간 표기: 115일 (약 16주)
export function periodLabel(startDate: string, endDate: string) {
  if (!startDate || !endDate) return "";

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  if (days <= 0) return "종료일이 시작일보다 빠릅니다";

  return `${days}일  (약 ${Math.round(days / 7)}주)`;
}
