"use client";

import { useEffect, useState } from "react";

import Button from "@/components/Button/Button";
import Modal from "@/components/Modal/Modal";
import FormField from "@/components/FormField/FormField";
import SelectField from "@/components/SelectField/SelectField";
import DatePicker from "@/components/DatePicker/DatePicker";

import { getErrorCode } from "@/lib/api/errorCode";
import { useCreateExpenseMutation } from "@/features/project/finance/hooks/mutations/useExpenseMutations";
import {
  CATEGORY_LABEL,
  type ExpenseCategory,
} from "@/features/project/finance/api/financeApi";

import styles from "./ExpenseFormModal.module.css";

// 서버 검증과 동일한 상한 (ExpenseRequest)
const MAX_MERCHANT = 100;
const MAX_PURPOSE = 255;

const CATEGORY_OPTIONS = (
  Object.keys(CATEGORY_LABEL) as ExpenseCategory[]
).map((category) => ({ value: category, label: CATEGORY_LABEL[category] }));

// 원인별로 다르게 알려준다 — 사용일 범위와 권한은 사용자가 고칠 수 있는 문제라 구분이 필요하다.
const ERROR_MESSAGE: Record<string, string> = {
  EXPENSE_003: "사용일이 프로젝트 기간을 벗어났어요.",
  MEMBER_001: "이 프로젝트에 참여 중일 때만 지출을 등록할 수 있어요.",
  PROJECT_004: "프로젝트를 찾을 수 없어요.",
  USER_003: "퇴사한 사용자는 지출을 등록할 수 없어요.",
  REQUEST_001: "입력값을 다시 확인해 주세요.",
  REQUEST_028: "같은 요청이 이미 접수됐어요. 잠시 후 다시 시도해 주세요.",
};

interface ExpenseFormModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  // 사용일은 프로젝트 기간 안에서만 고를 수 있다 (EXPENSE_003)
  period?: { startDate: string; endDate: string };
}

export default function ExpenseFormModal({
  open,
  onClose,
  projectId,
  period,
}: ExpenseFormModalProps) {
  // State
  const [expenseDate, setExpenseDate] = useState("");
  const [category, setCategory] = useState("");
  const [merchant, setMerchant] = useState("");
  const [purpose, setPurpose] = useState("");
  const [amount, setAmount] = useState("");
  const [errorText, setErrorText] = useState("");

  // 연타·재시도로 지출이 두 건 생기지 않게, 폼이 열릴 때 한 번 발급해 둔다
  const [idempotencyKey, setIdempotencyKey] = useState("");

  // Query
  const { mutate: createExpense, isPending } =
    useCreateExpenseMutation(projectId);

  // Effect — 열릴 때마다 새 키를 발급한다 (닫았다 다시 열면 별개의 등록)
  useEffect(() => {
    if (!open) return;
    setIdempotencyKey(crypto.randomUUID());
  }, [open]);

  // Event Handler
  const resetAndClose = () => {
    setExpenseDate("");
    setCategory("");
    setMerchant("");
    setPurpose("");
    setAmount("");
    setErrorText("");
    onClose();
  };

  // 숫자만 남긴다 — 서버가 1원 이상의 정수만 받는다
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value.replace(/[^0-9]/g, ""));
  };

  const handleSubmit = () => {
    setErrorText("");

    createExpense(
      {
        body: {
          expenseDate,
          category: category as ExpenseCategory,
          merchant: merchant.trim(),
          purpose: purpose.trim(),
          amount: Number(amount),
        },
        idempotencyKey,
      },
      {
        onSuccess: resetAndClose,
        onError: (error) => {
          const code = getErrorCode(error);
          setErrorText(
            (code && ERROR_MESSAGE[code]) || "지출을 등록하지 못했어요.",
          );
        },
      },
    );
  };

  // 다섯 항목 모두 필수. 금액은 1원 이상.
  const canSubmit =
    !!expenseDate &&
    !!category &&
    !!merchant.trim() &&
    !!purpose.trim() &&
    Number(amount) >= 1 &&
    !isPending;

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title="지출 추가"
      width={520}
      footer={
        <>
          <Button status="cancel" size="sm" name="취소" onClick={resetAndClose} />
          <Button
            status="primary"
            size="sm"
            name={isPending ? "추가 중…" : "추가"}
            disabled={!canSubmit}
            onClick={handleSubmit}
          />
        </>
      }
    >
      <div className={styles.form}>
        {/* 기간 안내는 라벨 줄에 얹는다 — 아래에 두면 모달 높이가 변한다 */}
        <DatePicker
          label="사용일"
          required
          labelSlot={period ? "프로젝트 기간 내에서만 선택" : undefined}
          value={expenseDate}
          onChange={setExpenseDate}
          minDate={period?.startDate}
          maxDate={period?.endDate}
          placeholder="날짜를 선택하세요"
        />

        <SelectField
          label="지출 유형"
          required
          value={category}
          onChange={setCategory}
          placeholder="유형을 선택하세요"
          options={CATEGORY_OPTIONS}
        />

        <div className={styles.field}>
          <FormField
            label="사용처"
            required
            placeholder="예: 코레일"
            maxLength={MAX_MERCHANT}
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
          />
          {merchant.length >= MAX_MERCHANT && (
            <p className={styles.warn}>
              사용처는 최대 {MAX_MERCHANT}자까지 입력할 수 있어요.
            </p>
          )}
        </div>

        <div className={styles.field}>
          <FormField
            label="사용 목적"
            required
            placeholder="예: 부산 거래처 미팅 출장"
            maxLength={MAX_PURPOSE}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />
          {purpose.length >= MAX_PURPOSE && (
            <p className={styles.warn}>
              사용 목적은 최대 {MAX_PURPOSE}자까지 입력할 수 있어요.
            </p>
          )}
        </div>

        {/* 입력은 숫자만 받고, 자릿수를 읽기 쉽게 콤마를 얹어 보여준다 */}
        <FormField
          label="금액"
          required
          inputMode="numeric"
          placeholder="0"
          value={amount ? Number(amount).toLocaleString("ko-KR") : ""}
          onChange={handleAmountChange}
          rightSlot="원"
        />

        {errorText && <p className={styles.error}>{errorText}</p>}
      </div>
    </Modal>
  );
}
