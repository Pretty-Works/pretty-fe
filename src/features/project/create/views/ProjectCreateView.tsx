"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import Button from "@/components/Button/Button";
import FormField from "@/components/FormField/FormField";
import DatePicker from "@/components/DatePicker/DatePicker";
import SearchBar from "@/components/SearchBar/SearchBar";

import { useAgentStore } from "@/stores/useAgentStore";

import { useCreateProjectMutation } from "@/features/project/create/hooks/mutations/useCreateProjectMutation";
import {
  fetchCompanyUsers,
  type CompanyUser,
  type MilestoneInput,
} from "@/features/project/create/api/projectApi";

import styles from "./ProjectCreateView.module.css";

// 로그인 사용자(오너). TODO: 로그인 사용자 정보 연동
const OWNER: CompanyUser = { userId: 12, name: "김서준", team: "PM팀" };

// 서버 검증(ProjectRequest)과 동일한 상한. 넘기기 전에 화면에서 막는다.
const MAX = {
  name: 100,
  description: 500,
  role: 20,
  milestoneGoal: 200,
  members: 100,
  milestones: 50,
} as const;

interface MemberRow extends CompanyUser {
  role: string;
}

interface MilestoneRow extends MilestoneInput {
  key: string;
}

// 기간 표기: 115일 (약 16주)
function periodLabel(startDate: string, endDate: string) {
  if (!startDate || !endDate) return "";

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  if (days <= 0) return "종료일이 시작일보다 빠릅니다";

  return `${days}일  (약 ${Math.round(days / 7)}주)`;
}

const SMALL_UNITS = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
const TEN_UNITS = ["", "십", "백", "천"];
const BIG_UNITS = ["", "만", "억", "조"];

// 목표 예산 한글 표기: 120000000 → 일억 이천만 원
function koreanMoney(value: number) {
  if (!value) return "";

  const digits = String(value).split("").reverse();
  const chunks: string[] = [];

  for (let i = 0; i < digits.length; i += 4) {
    const chunk = digits.slice(i, i + 4);
    let text = "";

    chunk.forEach((digit, index) => {
      const n = Number(digit);
      if (n === 0) return;
      text = `${SMALL_UNITS[n]}${TEN_UNITS[index]}${text}`;
    });

    if (text) chunks.push(`${text}${BIG_UNITS[i / 4]}`);
  }

  return `${chunks.reverse().join(" ")} 원`;
}

// 1234567 → 1,234,567
const withComma = (value: string) =>
  value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export default function ProjectCreateView() {
  const router = useRouter();

  const openAgent = useAgentStore((state) => state.openAgent);

  // State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [noBudgetLimit, setNoBudgetLimit] = useState(false); // 예산 제한 없음(0)

  const [ownerRole, setOwnerRole] = useState("PM");
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [memberKeyword, setMemberKeyword] = useState("");
  const [suggestions, setSuggestions] = useState<CompanyUser[]>([]);

  const [milestones, setMilestones] = useState<MilestoneRow[]>([]);

  // 마일스톤 드래그 정렬 — 손잡이를 누른 행만 draggable이 된다(입력 선택 방해 방지)
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Query
  const { mutate: createProject, isPending } = useCreateProjectMutation();

  // Effect — 참여자 검색
  useEffect(() => {
    let alive = true;

    fetchCompanyUsers(memberKeyword).then((users) => {
      if (alive) setSuggestions(users);
    });

    return () => {
      alive = false;
    };
  }, [memberKeyword]);

  // 이미 담긴 사람은 검색 결과에서 숨긴다 — 오너(나) + 추가된 참여자
  const selectableSuggestions = suggestions.filter(
    (user) =>
      user.userId !== OWNER.userId &&
      !members.some((member) => member.userId === user.userId),
  );

  // Event Handler
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBudget(e.target.value.replace(/[^\d]/g, ""));
  };

  const addMember = (user: CompanyUser) => {
    setMembers((prev) => {
      if (prev.some((m) => m.userId === user.userId)) return prev;
      if (prev.length >= MAX.members) return prev; // 참여자 상한
      return [...prev, { ...user, role: "" }];
    });
    setMemberKeyword("");
  };

  const removeMember = (userId: number) => {
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
  };

  const changeMemberRole = (userId: number, role: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.userId === userId ? { ...m, role } : m)),
    );
  };

  const addMilestone = () => {
    setMilestones((prev) =>
      prev.length >= MAX.milestones // 마일스톤 상한
        ? prev
        : [...prev, { key: crypto.randomUUID(), targetDate: "", goal: "" }],
    );
  };

  const changeMilestone = (key: string, patch: Partial<MilestoneInput>) => {
    setMilestones((prev) =>
      prev.map((ms) => (ms.key === key ? { ...ms, ...patch } : ms)),
    );
  };

  const removeMilestone = (key: string) => {
    setMilestones((prev) => prev.filter((ms) => ms.key !== key));
  };

  // 마일스톤 순서 변경 (드래그 · 키보드 공용)
  const moveMilestone = (from: number, to: number) => {
    setMilestones((prev) => {
      if (from === to || to < 0 || to >= prev.length) return prev;

      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const handleDrop = (to: number) => {
    if (dragIndex !== null) moveMilestone(dragIndex, to);
    setDragIndex(null);
    setOverIndex(null);
    setDragKey(null);
  };

  const handleSubmit = () => {
    createProject(
      {
        name,
        startDate,
        endDate,
        // 0 = 예산 제한 없음. 미입력(null)도 서버가 0으로 저장한다.
        budget: noBudgetLimit ? 0 : budget ? Number(budget) : null,
        description,
        ownerRole: ownerRole || null,
        members: members.map((m) => ({ userId: m.userId, role: m.role || null })),
        milestones: milestones
          .filter((ms) => ms.targetDate && ms.goal)
          .map(({ targetDate, goal }) => ({ targetDate, goal })),
      },
      {
        onSuccess: (data) => {
          router.push(`/projects/${data.result.projectId}/overview`);
        },
      },
    );
  };

  const canSubmit = !!name.trim() && !!startDate && !!endDate && !isPending;

  return (
    <main className={styles.container}>
      {/* 페이지 헤더 */}
      <div className={styles.pageHead}>
        <div className={styles.pageHeadText}>
          <h2 className={styles.pageTitle}>프로젝트 생성</h2>
          <button
            type="button"
            className={styles.pageSub}
            onClick={openAgent}
          >
            AI와 함께 유사 프로젝트 이력을 기반으로 작성할 수 있어요 →
          </button>
        </div>
        <div className={styles.actions}>
          <Button
            status="cancel"
            size="sm"
            name="취소"
            onClick={() => router.back()}
          />
          <Button
            status="primary"
            size="sm"
            name={isPending ? "생성 중…" : "생성하기"}
            disabled={!canSubmit}
            onClick={handleSubmit}
          />
        </div>
      </div>

      {/* 기본 정보 */}
      <section className={styles.card}>
        <h3 className={styles.cardTitle}>기본 정보</h3>

        <div className={styles.fieldWrap}>
          <FormField
            label="프로젝트명"
            required
            placeholder="예: 그룹웨어 AI 고도화"
            maxLength={MAX.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {name.length >= MAX.name && (
            <p className={styles.warn}>
              프로젝트명은 최대 {MAX.name}자까지 입력할 수 있어요.
            </p>
          )}
        </div>

        <div className={styles.fieldWrap}>
          <FormField
            label="프로젝트 설명"
            placeholder="예: 사내 그룹웨어에 AI 기능을 더하는 프로젝트"
            maxLength={MAX.description}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {description.length >= MAX.description && (
            <p className={styles.warn}>
              설명은 최대 {MAX.description}자까지 입력할 수 있어요.
            </p>
          )}
        </div>

        <div className={styles.row}>
          <div className={styles.col}>
            <DatePicker
              label="시작일"
              required
              value={startDate}
              onChange={setStartDate}
              placeholder="날짜를 선택하세요"
            />
          </div>
          <div className={styles.col}>
            <DatePicker
              label="목표일"
              required
              value={endDate}
              onChange={setEndDate}
              minDate={startDate || undefined} /* 시작일 이전 선택 불가 */
              placeholder="날짜를 선택하세요"
            />
          </div>
          <div className={styles.col}>
            <FormField
              label="기간"
              placeholder="시작일·목표일을 선택하세요"
              value={periodLabel(startDate, endDate)}
              readOnly
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.col}>
            <FormField
              label="목표 예산"
              placeholder={noBudgetLimit ? "제한 없음" : "₩ 120,000,000"}
              value={noBudgetLimit || !budget ? "" : `₩ ${withComma(budget)}`}
              onChange={handleBudgetChange}
              readOnly={noBudgetLimit}
            />
          </div>
          <div className={styles.col}>
            <FormField
              label="한글 표기"
              placeholder="목표 예산을 입력하세요"
              value={noBudgetLimit ? "제한 없음" : koreanMoney(Number(budget))}
              readOnly
            />
          </div>
          <button
            type="button"
            className={[
              styles.budgetToggle,
              noBudgetLimit && styles.budgetToggleOn,
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setNoBudgetLimit((v) => !v)}
            aria-pressed={noBudgetLimit}
          >
            예산 제한 없음
          </button>
        </div>
      </section>

      {/* 참여자 */}
      <section className={styles.card}>
        <h3 className={styles.cardTitle}>참여자</h3>

        <div className={styles.memberSearch}>
          <SearchBar
            placeholder={
              members.length >= MAX.members
                ? `참여자는 최대 ${MAX.members}명까지 등록할 수 있어요`
                : "이름으로 참여자 검색·추가"
            }
            value={memberKeyword}
            onChange={(e) => setMemberKeyword(e.target.value)}
            disabled={members.length >= MAX.members}
          />
          {memberKeyword.trim() && (
            <ul className={styles.suggest}>
              {selectableSuggestions.length > 0 ? (
                selectableSuggestions.map((user) => (
                  <li key={user.userId}>
                    <button
                      type="button"
                      className={styles.suggestItem}
                      onClick={() => addMember(user)}
                    >
                      {user.name} · {user.team}
                    </button>
                  </li>
                ))
              ) : (
                <li className={styles.suggestEmpty}>검색 결과가 없어요</li>
              )}
            </ul>
          )}
        </div>

        <div className={styles.memberGrid}>
          {/* 오너(생성자) — 제거 불가 */}
          <div className={styles.memberCard}>
            <span className={styles.memberName}>{OWNER.name}</span>
            <span className={styles.memberTeam}>· {OWNER.team}</span>
            <input
              className={styles.roleInput}
              placeholder="역할"
              maxLength={MAX.role}
              value={ownerRole}
              onChange={(e) => setOwnerRole(e.target.value)}
              aria-label={`${OWNER.name} 역할`}
            />
            <span className={styles.ownerBadge}>책임자</span>
          </div>

          {members.map((member) => (
            <div key={member.userId} className={styles.memberCard}>
              <span className={styles.memberName}>{member.name}</span>
              <span className={styles.memberTeam}>· {member.team}</span>
              <input
                className={styles.roleInput}
                placeholder="역할"
                maxLength={MAX.role}
                value={member.role}
                onChange={(e) => changeMemberRole(member.userId, e.target.value)}
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

      {/* 마일스톤 */}
      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h3 className={styles.cardTitle}>마일스톤</h3>
          <Button
            ui="tonal"
            size="xs"
            name="마일스톤 추가"
            hasPlus
            disabled={milestones.length >= MAX.milestones}
            onClick={addMilestone}
          />
        </div>

        {milestones.length === 0 ? (
          <p className={styles.emptyText}>
            시기별 목표를 추가해 주세요. 목표일과 목표 내용을 모두 입력해야 저장됩니다.
          </p>
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
                className={[
                  styles.msRow,
                  dragIndex === index && styles.msRowDragging,
                  // 놓일 자리를 선으로 표시. 아래로 끌면 이 행 밑, 위로 끌면 이 행 위.
                  overIndex === index &&
                    dragIndex !== null &&
                    dragIndex !== index &&
                    (dragIndex < index
                      ? styles.msRowInsertBelow
                      : styles.msRowInsertAbove),
                ]
                  .filter(Boolean)
                  .join(" ")}
                draggable={dragKey === ms.key}
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverIndex(index);
                }}
                onDrop={() => handleDrop(index)}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                  setDragKey(null);
                }}
              >
                <span
                  className={styles.msHandle}
                  role="button"
                  tabIndex={0}
                  aria-label={`마일스톤 ${index + 1}번 순서 변경 — 방향키로 이동`}
                  onMouseDown={() => setDragKey(ms.key)}
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
                    onChange={(date) => changeMilestone(ms.key, { targetDate: date })}
                    /* 마일스톤 목표일은 프로젝트 기간 안이어야 한다 */
                    minDate={startDate || undefined}
                    maxDate={endDate || undefined}
                    placeholder="날짜 선택"
                  />
                </div>
                <input
                  className={styles.msGoal}
                  placeholder="예: 요구 정의 · 아키텍처 설계"
                  maxLength={MAX.milestoneGoal}
                  value={ms.goal}
                  onChange={(e) => changeMilestone(ms.key, { goal: e.target.value })}
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
    </main>
  );
}
