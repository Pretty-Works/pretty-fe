"use client";

import { useState } from "react";

import { getErrorCode } from "@/lib/api/errorCode";

import {
  CATEGORY_LABEL,
  type Expense,
  type ExpenseCategory,
} from "@/features/project/finance/api/financeApi/financeApi";
import {
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
  useUpdateExpenseMutation,
} from "@/features/project/finance/hooks/mutations/useExpenseMutations";

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

export const EXPENSE_FORM_LIMITS = { merchant: 100, purpose: 255 } as const;
export const EXPENSE_CATEGORY_OPTIONS = (
  Object.keys(CATEGORY_LABEL) as ExpenseCategory[]
).map((category) => ({ value: category, label: CATEGORY_LABEL[category] }));

interface ExpenseFormControllerOptions {
  projectId: string;
  expense?: Expense;
  onClose: () => void;
}

export function useExpenseFormController({
  projectId,
  expense,
  onClose,
}: ExpenseFormControllerOptions) {
  const isEdit = !!expense;
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const { mutate: createExpense, isPending: isCreating } =
    useCreateExpenseMutation(projectId);
  const { mutate: updateExpense, isPending: isUpdating } =
    useUpdateExpenseMutation(projectId);
  const { mutate: deleteExpense, isPending: isDeleting } =
    useDeleteExpenseMutation(projectId);
  const isSaving = isCreating || isUpdating;
  const isPending = isSaving || isDeleting;

  const showError = (error: unknown, fallback: string) => {
    const code = getErrorCode(error);
    setErrorText((code && ERROR_MESSAGE[code]) || fallback);
  };
  const changeAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(event.target.value.replace(/[^0-9]/g, ""));
  };
  const submit = () => {
    setErrorText("");
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
  const remove = () => {
    if (!expense) return;
    setErrorText("");
    deleteExpense(expense.expenseId, {
      onSuccess: onClose,
      onError: (error) => {
        setDeleteOpen(false);
        showError(error, "지출을 삭제하지 못했어요.");
      },
    });
  };

  return {
    isEdit,
    expenseDate,
    setExpenseDate,
    category,
    setCategory,
    merchant,
    setMerchant,
    purpose,
    setPurpose,
    amount,
    changeAmount,
    errorText,
    deleteOpen,
    setDeleteOpen,
    isDeleting,
    isSaving,
    isPending,
    submit,
    remove,
    canSubmit:
      !!expenseDate &&
      !!category &&
      !!merchant.trim() &&
      !!purpose.trim() &&
      Number(amount) >= 1 &&
      !isPending,
  };
}
