import {
  CATEGORY_LABEL,
  type Expense,
} from "@/features/project/finance/api/financeApi";

import styles from "./ExpenseTable.module.css";

interface ExpenseTableProps {
  expenses: Expense[];
  onSelect?: (expense: Expense) => void;
}

export default function ExpenseTable({ expenses, onSelect }: ExpenseTableProps) {
  return (
    <div className={styles.table} role="table">
      <div className={styles.head} role="row">
        <span className={`${styles.col} ${styles.colDate}`}>사용일</span>
        <span className={`${styles.col} ${styles.colCategory}`}>지출 유형</span>
        <span className={`${styles.col} ${styles.colMerchant}`}>사용처</span>
        <span className={`${styles.col} ${styles.colPurpose}`}>사용 목적</span>
        <span className={`${styles.col} ${styles.colSpender}`}>사용자</span>
        <span className={`${styles.col} ${styles.colAmount}`}>금액</span>
      </div>

      {expenses.map((expense) => (
        <div
          key={expense.expenseId}
          className={styles.row}
          role="row"
          onClick={() => onSelect?.(expense)}
        >
          <div className={`${styles.cell} ${styles.colDate}`}>
            {expense.expenseDate}
          </div>
          <div className={`${styles.cell} ${styles.colCategory}`}>
            <span className={styles.clip}>
              {CATEGORY_LABEL[expense.category]}
            </span>
          </div>
          <div className={`${styles.cell} ${styles.colMerchant}`}>
            <span className={styles.clip}>{expense.merchant}</span>
          </div>
          <div className={`${styles.cell} ${styles.colPurpose}`}>
            <span className={styles.clip}>{expense.purpose}</span>
          </div>
          <div className={`${styles.cell} ${styles.colSpender}`}>
            <span className={styles.clip}>{expense.spender.name}</span>
          </div>
          <div className={`${styles.cell} ${styles.colAmount}`}>
            {expense.amount.toLocaleString("ko-KR")}원
          </div>
        </div>
      ))}
    </div>
  );
}
