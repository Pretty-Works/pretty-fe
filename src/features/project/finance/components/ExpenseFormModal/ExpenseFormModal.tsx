"use client";

import { useEffect, useState } from "react";

import Button from "@/components/Button/Button";
import Modal from "@/components/Modal/Modal";
import FormField from "@/components/FormField/FormField";
import SelectField from "@/components/SelectField/SelectField";
import DatePicker from "@/components/DatePicker/DatePicker";

import { getErrorCode } from "@/lib/api/errorCode";
import {
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} from "@/features/project/finance/hooks/mutations/useExpenseMutations";
import {
  CATEGORY_LABEL,
  type Expense,
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
  EXPENSE_004: "지출 내역을 찾을 수 없어요.",
  EXPENSE_005: "본인이 등록한 지출만 수정·삭제할 수 있어요.",
  EXPENSE_006: "이미 삭제된 지출이에요.",
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
  // 값을 넘기면 수정 모드가 된다 (없으면 추가 모드)
  expense?: Expense;
}

export default function ExpenseFormModal({
  open,
  onClose,
  projectId,
  period,
  expense,
}: ExpenseFormModalProps) {
  const isEdit = !!expense;

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
  const { mutate: createExpense, isPending: isCreating } =
    useCreateExpenseMutation(projectId);
  const { mutate: updateExpense, isPending: isUpdating } =
    useUpdateExpenseMutation(projectId);
  const { mutate: deleteExpense, isPending: isDeleting } =
    useDeleteExpenseMutation(projectId);

  // 저장(추가·수정)과 삭제를 나눠 둔다 — 삭제 중에 저장 버튼이 진행 상태로 보이면 안 된다.
  const isSaving = isCreating || isUpdating;
  const isPending = isSaving || isDeleting;

  // Effect — 열릴 때 초기값을 채운다 (수정 모드면 기존 값, 아니면 빈 폼 + 새 멱등 키)
  useEffect(() => {
    if (!open) return;

    if (expense) {
      setExpenseDate(expense.expenseDate);
      setCategory(expense.category);
      setMerchant(expense.merchant);
      setPurpose(expense.purpose);
      setAmount(String(expense.amount));
      return;
    }

    // 연타·재시도로 지출이 두 건 생기지 않게 한 번 발급한다.
    // 수정은 PUT(멱등)이라 키가 필요 없다.
    setIdempotencyKey(crypto.randomUUID());
  }, [open, expense]);

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

  // 서버가 돌려준 실패 원인을 문구로 바꾼다
  const showError = (error: unknown, fallback: string) => {
    const code = getErrorCode(error);
    setErrorText((code && ERROR_MESSAGE[code]) || fallback);
  };

  // 숫자만 남긴다 — 서버가 1원 이상의 정수만 받는다
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value.replace(/[^0-9]/g, ""));
  };

  const handleSubmit = () => {
    setErrorText("");

    // PUT은 전체 교체라 수정 때도 다섯 필드를 모두 보낸다
    const body = {
      expenseDate,
      category: category as ExpenseCategory,
      merchant: merchant.trim(),
      purpose: purpose.trim(),
      amount: Number(amount),
    };

    if (expense) {
      updateExpense(
        { expenseId: expense.expenseId, body },
        {
          onSuccess: resetAndClose,
          onError: (error) => showError(error, "지출을 수정하지 못했어요."),
        },
      );
      return;
    }

    createExpense(
      { body, idempotencyKey },
      {
        onSuccess: resetAndClose,
        onError: (error) => showError(error, "지출을 등록하지 못했어요."),
      },
    );
  };

  const handleDelete = () => {
    if (!expense) return;
    setErrorText("");

    deleteExpense(expense.expenseId, {
      onSuccess: resetAndClose,
      onError: (error) => showError(error, "지출을 삭제하지 못했어요."),
    });
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
      title={isEdit ? "지출 수정" : "지출 추가"}
      width={520}
      footer={
        <>
          {/* 삭제는 왼쪽 끝으로 밀어 실수로 누르지 않게 한다 */}
          {isEdit && (
            <button
              type="button"
              className={styles.deleteButton}
              disabled={isPending}
              onClick={handleDelete}
            >
              {isDeleting ? "삭제 중…" : "삭제"}
            </button>
          )}
          <Button
            type="light"
            buttonStyle="weak"
            size="medium"
            onClick={resetAndClose}
          >
            취소
          </Button>
          <Button
            size="medium"
            loading={isSaving}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {isEdit ? "수정" : "추가"}
          </Button>
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

        {/* 상한을 넘기면 FormField가 알아서 알려 준다 */}
        <FormField
          label="사용처"
          required
          placeholder="예: 코레일"
          maxLength={MAX_MERCHANT}
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
        />

        <FormField
          label="사용 목적"
          required
          placeholder="예: 부산 거래처 미팅 출장"
          maxLength={MAX_PURPOSE}
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        />

        {/* 입력은 숫자만 받고, 자릿수를 읽기 쉽게 콤마를 얹어 보여준다 */}
        <FormField
          label="금액"
          required
          inputMode="numeric"
          placeholder="0"
          value={amount ? Number(amount).toLocaleString("ko-KR") : ""}
          onChange={handleAmountChange}
          right="원"
        />

        {errorText && <p className={styles.error}>{errorText}</p>}
      </div>
    </Modal>
  );
}
