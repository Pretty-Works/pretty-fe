"use client";

import { useId } from "react";

import { LuCrown } from "react-icons/lu";

import { cx } from "@/lib/cx";

import Button from "@/components/Button/Button";
import DatePicker from "@/components/DatePicker/DatePicker";
import FormField from "@/components/FormField/FormField";
import SearchBar from "@/components/SearchBar/SearchBar";

import {
  type ProjectFormControllerOptions,
  useProjectFormController,
} from "@/features/project/create/hooks/useProjectFormController";
import {
  koreanMoney,
  periodLabel,
  withComma,
} from "@/features/project/create/utils/format";
import { DEPARTMENT_LABEL } from "@/features/user/constants/organization";
import LeaveConfirmModal from "@/features/project/components/modal/LeaveConfirmModal";

import styles from "./ProjectForm.module.css";

type ProjectFormProps = ProjectFormControllerOptions;

export default function ProjectForm({ projectId, detail }: ProjectFormProps) {
  const memberSuggestionsId = useId();
  const {
    limits,
    isEdit,
    name,
    setName,
    description,
    setDescription,
    startDate,
    changeStartDate,
    endDate,
    setEndDate,
    budget,
    changeBudget,
    noBudgetLimit,
    setNoBudgetLimit,
    ownerRole,
    setOwnerRole,
    members,
    memberKeyword,
    setMemberKeyword,
    milestones,
    searching,
    selectableSuggestions,
    ownerUserId,
    ownerName,
    ownerProfileLabel,
    isOnLeave,
    profileLabel,
    addMember,
    removeMember,
    changeMemberRole,
    addMilestone,
    changeMilestone,
    removeMilestone,
    moveMilestone,
    drag,
    leaveGuard,
    openAgent,
    submit,
    isPending,
    canSubmit,
  } = useProjectFormController({ projectId, detail });

  // 생성 화면은 독립 페이지, 수정 화면은 이미 프로젝트의 main 안에 놓인다.
  const Root = isEdit ? "div" : "main";

  return (
    <Root className={cx(styles.container, isEdit && styles.embedded)}>
      <div className={styles.pageHead}>
        <div className={styles.pageHeadText}>
          <h1 className={styles.pageTitle}>
            {isEdit ? "프로젝트 수정" : "프로젝트 생성"}
          </h1>
          <button type="button" className={styles.pageSub} onClick={openAgent}>
            AI와 함께 유사 프로젝트 이력을 기반으로 작성할 수 있어요 →
          </button>
        </div>
        <div className={styles.actions}>
          <Button
            type="light"
            buttonStyle="weak"
            size="medium"
            onClick={leaveGuard.requestExit}
          >
            취소
          </Button>
          <Button
            size="medium"
            loading={isPending}
            disabled={!canSubmit}
            onClick={submit}
          >
            {isEdit ? "수정하기" : "생성하기"}
          </Button>
        </div>
      </div>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>기본 정보</h2>

        <FormField
          label="프로젝트명"
          required
          placeholder="예: 그룹웨어 AI 고도화"
          maxLength={limits.name}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <FormField
          label="프로젝트 설명"
          placeholder="예: 사내 그룹웨어에 AI 기능을 더하는 프로젝트"
          maxLength={limits.description}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className={styles.row}>
          <div className={styles.col}>
            <DatePicker
              label="시작일"
              required
              value={startDate}
              onChange={changeStartDate}
              placeholder="날짜를 선택하세요"
            />
          </div>
          <div className={styles.col}>
            <DatePicker
              label="목표일"
              required
              value={endDate}
              onChange={setEndDate}
              minDate={startDate || undefined}
              placeholder="날짜를 선택하세요"
            />
          </div>
          <div className={styles.col}>
            <FormField
              label="기간"
              value={periodLabel(startDate, endDate)}
              readOnly
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.col}>
            <FormField
              label="목표 예산"
              required
              placeholder={noBudgetLimit ? "제한 없음" : ""}
              value={noBudgetLimit || !budget ? "" : `₩ ${withComma(budget)}`}
              onChange={changeBudget}
              readOnly={noBudgetLimit}
            />
          </div>
          <div className={styles.col}>
            <FormField
              label="한글 표기"
              value={noBudgetLimit ? "제한 없음" : koreanMoney(budget)}
              readOnly
            />
          </div>
          <button
            type="button"
            className={cx(
              styles.budgetToggle,
              noBudgetLimit && styles.budgetToggleOn,
            )}
            onClick={() => setNoBudgetLimit((v) => !v)}
            aria-pressed={noBudgetLimit}
          >
            예산 제한 없음
          </button>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>참여자</h2>

        <div className={styles.memberSearch}>
          <SearchBar
            placeholder={
              members.length >= limits.members
                ? `참여자는 최대 ${limits.members}명까지 등록할 수 있어요`
                : "이름으로 참여자 추가"
            }
            value={memberKeyword}
            onChange={(e) => setMemberKeyword(e.target.value)}
            disabled={members.length >= limits.members}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={!!memberKeyword.trim()}
            aria-controls={
              memberKeyword.trim() ? memberSuggestionsId : undefined
            }
          />
          {memberKeyword.trim() && (
            <ul
              id={memberSuggestionsId}
              className={styles.suggest}
              role={selectableSuggestions.length > 0 ? "listbox" : undefined}
            >
              {selectableSuggestions.length > 0 ? (
                selectableSuggestions.map((user) => (
                  <li key={user.userId} role="presentation">
                    <button
                      type="button"
                      className={styles.suggestItem}
                      onClick={() => addMember(user)}
                      role="option"
                      aria-selected="false"
                    >
                      <span className={styles.suggestName}>
                        {user.name} · {DEPARTMENT_LABEL[user.department]}
                      </span>

                      {user.status === "ON_LEAVE" && (
                        <span className={styles.suggestLeave}>휴직</span>
                      )}
                    </button>
                  </li>
                ))
              ) : (
                <li className={styles.suggestEmpty} role="status">
                  {searching ? "찾는 중이에요…" : "검색 결과가 없어요"}
                </li>
              )}
            </ul>
          )}
        </div>

        <div className={styles.memberGrid}>
          {/* 오너(생성자) — 제거 불가. 다른 참여자의 ✕ 자리에 왕관을 둔다 */}
          <div className={styles.memberCard}>
            <span className={styles.memberName}>{ownerName}</span>
            <span className={styles.memberTeam}>{ownerProfileLabel}</span>
            {ownerUserId !== undefined && isOnLeave(ownerUserId) && (
              <span className={styles.leave}>휴직</span>
            )}
            <input
              className={styles.roleInput}
              placeholder="역할"
              maxLength={limits.role}
              value={ownerRole}
              onChange={(e) => setOwnerRole(e.target.value)}
              aria-label={`${ownerName} 역할`}
            />
            <span className={styles.ownerMark} title="프로젝트 책임자">
              <LuCrown aria-label="프로젝트 책임자" />
            </span>
          </div>

          {members.map((member) => (
            <div key={member.userId} className={styles.memberCard}>
              <span className={styles.memberName}>{member.name}</span>
              <span className={styles.memberTeam}>
                {profileLabel(member.userId, member)}
              </span>
              {isOnLeave(member.userId, member) && (
                <span className={styles.leave}>휴직</span>
              )}
              <input
                className={styles.roleInput}
                placeholder="역할"
                maxLength={limits.role}
                value={member.role}
                onChange={(e) =>
                  changeMemberRole(member.userId, e.target.value)
                }
                aria-label={`${member.name} 역할`}
              />
              <button
                type="button"
                className={styles.memberRemove}
                onClick={() => removeMember(member.userId)}
                aria-label={`${member.name} 참여자 제거`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h2 className={styles.cardTitle}>마일스톤</h2>
          <Button
            size="tiny"
            leftAccessory="+"
            disabled={milestones.length >= limits.milestones}
            onClick={addMilestone}
          >
            마일스톤 추가
          </Button>
        </div>

        {milestones.length === 0 ? (
          <p className={styles.emptyText}>시기별 목표를 추가해 주세요.</p>
        ) : (
          <>
            <div className={styles.msHead}>
              <span className={styles.msHeadHandle} />
              <span className={styles.msHeadDate}>목표일정</span>
              <span className={styles.msHeadGoal}>목표</span>
              <span className={styles.msHeadAction} />
            </div>

            {milestones.map((ms, index) => (
              <div
                key={ms.key}
                className={cx(
                  styles.msRow,
                  drag.dragIndex === index && styles.msRowDragging,
                  // 놓일 자리를 선으로 표시
                  drag.overIndex === index &&
                    drag.dragIndex !== null &&
                    drag.dragIndex !== index &&
                    (drag.dragIndex < index
                      ? styles.msRowInsertBelow
                      : styles.msRowInsertAbove),
                )}
                draggable={drag.dragKey === ms.key}
                onDragStart={(e) => drag.start(index, e)}
                onDragOver={(e) => drag.over(index, e)}
                onDrop={() => drag.drop(index)}
                onDragEnd={drag.end}
              >
                <button
                  type="button"
                  className={styles.msHandle}
                  aria-label={`마일스톤 ${index + 1}번 순서 변경 — 방향키로 이동`}
                  onMouseDown={() => drag.grab(ms.key)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      moveMilestone(index, index - 1);
                    }
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      moveMilestone(index, index + 1);
                    }
                  }}
                />

                <div className={styles.msDate}>
                  <DatePicker
                    value={ms.targetDate}
                    onChange={(date) =>
                      changeMilestone(ms.key, { targetDate: date })
                    }
                    minDate={startDate || undefined}
                    maxDate={endDate || undefined}
                    placeholder="날짜 선택"
                  />
                </div>
                <input
                  className={styles.msGoal}
                  placeholder="목표 입력"
                  maxLength={limits.milestoneGoal}
                  value={ms.goal}
                  onChange={(e) =>
                    changeMilestone(ms.key, { goal: e.target.value })
                  }
                  aria-label={`마일스톤 ${index + 1}번 목표`}
                />
                <button
                  type="button"
                  className={styles.msRemove}
                  onClick={() => removeMilestone(ms.key)}
                  aria-label="마일스톤 제거"
                >
                  ✕
                </button>
              </div>
            ))}
          </>
        )}
      </section>

      <LeaveConfirmModal
        open={leaveGuard.confirmOpen}
        description={
          isEdit
            ? "저장하지 않은 수정 내용이 모두 사라지고 기존 프로젝트 정보로 돌아갑니다. 그래도 나가시겠어요?"
            : "입력한 기본 정보·참여자·마일스톤이 모두 사라집니다. 그래도 나가시겠어요?"
        }
        onStay={leaveGuard.stay}
        onLeave={leaveGuard.leave}
      />
    </Root>
  );
}
