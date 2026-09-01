// BE ExpenseCategory
export type ExpenseCategory =
  | "TRANSPORT"
  | "MEAL"
  | "SOFTWARE"
  | "OFFICE_SUPPLY"
  | "EDUCATION"
  | "LABOR"
  | "OUTSOURCING"
  | "INFRA"
  | "ETC";

export const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  TRANSPORT: "교통비",
  MEAL: "식대",
  SOFTWARE: "소프트웨어",
  OFFICE_SUPPLY: "사무용품",
  EDUCATION: "교육·세미나",
  LABOR: "인건비",
  OUTSOURCING: "외주",
  INFRA: "인프라",
  ETC: "기타",
};

// 사용일이 오늘 이전이면 EXECUTED, 이후면 PLANNED (서버가 날짜로 파생)
export type ExpenseStatus = "EXECUTED" | "PLANNED";
