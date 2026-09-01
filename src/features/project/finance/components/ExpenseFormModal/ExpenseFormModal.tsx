"use client";

import Button from "@/components/Button/Button";
import ConfirmDialog from "@/components/ConfirmDialog/ConfirmDialog";
import DatePicker from "@/components/DatePicker/DatePicker";
import FormField from "@/components/FormField/FormField";
import Modal from "@/components/Modal/Modal";
import SelectField from "@/components/SelectField/SelectField";

import {
  type Expense,
} from "@/features/project/finance/api/financeApi/financeApi";
import {
  EXPENSE_CATEGORY_OPTIONS,
  EXPENSE_FORM_LIMITS,
  useExpenseFormController,
} from "@/features/project/finance/hooks/useExpenseFormController";

import styles from "./ExpenseFormModal.module.css";

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
  const {
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
    canSubmit,
  } = useExpenseFormController({ projectId, expense, onClose });

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
            onClick={submit}
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
          options={EXPENSE_CATEGORY_OPTIONS}
        />

        {/* 상한을 넘기면 FormField가 알아서 알려 준다 */}
        <FormField
          label="사용처"
          required
          placeholder="예: 코레일"
          maxLength={EXPENSE_FORM_LIMITS.merchant}
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
        />

        <FormField
          label="사용 목적"
          required
          placeholder="예: 부산 거래처 미팅 출장"
          maxLength={EXPENSE_FORM_LIMITS.purpose}
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
          onChange={changeAmount}
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
        onConfirm={remove}
      />
    </Modal>
  );
}
