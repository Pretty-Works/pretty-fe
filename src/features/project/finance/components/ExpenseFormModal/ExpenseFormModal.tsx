"use client";

import { useState } from "react";

import { getErrorCode } from "@/lib/api/errorCode";

import Button from "@/components/Button/Button";
import ConfirmDialog from "@/components/ConfirmDialog/ConfirmDialog";
import DatePicker from "@/components/DatePicker/DatePicker";
import FormField from "@/components/FormField/FormField";
import Modal from "@/components/Modal/Modal";
import SelectField from "@/components/SelectField/SelectField";

import {
  CATEGORY_LABEL,
  type Expense,
  type ExpenseCategory,
} from "@/features/project/finance/api/financeApi";
import {
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} from "@/features/project/finance/hooks/mutations/useExpenseMutations";

import styles from "./ExpenseFormModal.module.css";

// 서버 검증과 동일한 상한 (ExpenseRequest)
const MAX_MERCHANT = 100;
const MAX_PURPOSE = 255;

const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABEL) as ExpenseCategory[]).map(
  (category) => ({ value: category, label: CATEGORY_LABEL[category] }),
);

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

  // State — 열 때 마운트되므로 초기값은 여기서 한 번만 잡는다
  const [expenseDate, setExpenseDate] = useState(
    () => expense?.expenseDate ?? "",
  );
  const [category, setCategory] = useState<string>(
    () => expense?.category ?? "",
  );
  const [merchant, setMerchant] = useState(() => expense?.merchant ?? "");
  const [purpose, setPurpose] = useState(() => expense?.purpose ?? "");
  const [amount, setAmount] = useState(() =>
    expense ? String(expense.amount) : "",
  );
  const [errorText, setErrorText] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false); // 삭제 확인

  // 연타·재시도로 지출이 두 건 생기지 않게 한 번 발급한다. 수정은 PUT(멱등)이라 필요 없다.
  const [idempotencyKey] = useState(() => crypto.randomUUID());

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
          onSuccess: onClose,
          onError: (error) => showError(error, "지출을 수정하지 못했어요."),
        },
      );
      return;
    }

    createExpense(
      { body, idempotencyKey },
      {
        onSuccess: onClose,
        onError: (error) => showError(error, "지출을 등록하지 못했어요."),
      },
    );
  };

  const handleDelete = () => {
    if (!expense) return;
    setErrorText("");

    deleteExpense(expense.expenseId, {
      onSuccess: onClose,
      // 확인 창을 닫아야 폼 아래의 실패 문구가 보인다
      onError: (error) => {
        setDeleteOpen(false);
        showError(error, "지출을 삭제하지 못했어요.");
      },
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
      onClose={onClose}
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
              onClick={() => setDeleteOpen(true)}
            >
              {isDeleting ? "삭제 중…" : "삭제"}
            </button>
          )}
          {/* 취소 버튼은 두지 않는다 — 헤더의 ✕가 같은 일을 한다 */}
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

      {/* 삭제 확인 — Modal은 body로 포털돼 이 폼 위에 겹쳐 뜬다 */}
      <ConfirmDialog
        open={deleteOpen}
        title="지출을 삭제할까요?"
        description={expense ? `삭제 후에는 복구가 어렵습니다.` : undefined}
        confirmLabel="삭제"
        tone="danger"
        loading={isDeleting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </Modal>
  );
}
