"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { LuCrown } from "react-icons/lu";

import Button from "@/components/Button/Button";
import FormField from "@/components/FormField/FormField";
import DatePicker from "@/components/DatePicker/DatePicker";
import SearchBar from "@/components/SearchBar/SearchBar";

import { getErrorCode } from "@/lib/api/errorCode";
import { useAgentStore } from "@/stores/useAgentStore";
import { useToastStore } from "@/stores/useToastStore";

import { useMyProfileQuery } from "@/features/user/hooks/queries/useMyProfileQuery";
import { useUserSearchQuery } from "@/features/user/hooks/queries/useUserSearchQuery";
import type { UserSearchResult } from "@/features/user/api/userApi";
import { DEPARTMENT_LABEL } from "@/features/project/overview/api/taskBoardApi";
import { useCreateProjectMutation } from "@/features/project/create/hooks/mutations/useCreateProjectMutation";
import { useUpdateProjectMutation } from "@/features/project/create/hooks/mutations/useUpdateProjectMutation";
import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";
import { type MilestoneInput } from "@/features/project/create/api/projectApi";

import styles from "./ProjectCreateView.module.css";

// 수정이 막히는 이유를 그대로 알려준다. 기간 축소 차단·동시 수정처럼
// 화면이 미리 알 수 없는 실패가 있어서, 서버가 준 원인을 보여주는 것 말고는 방법이 없다.
const UPDATE_ERROR_MESSAGE: Record<string, string> = {
  PROJECT_002: "참여자 중 찾을 수 없는 사용자가 있어요",
  PROJECT_003: "목표일은 시작일 이후여야 해요",
  PROJECT_004: "프로젝트를 찾을 수 없어요",
  PROJECT_005: "프로젝트 오너와 PM만 수정할 수 있어요",
  PROJECT_015: "마일스톤 목표일이 프로젝트 기간을 벗어났어요",
  PROJECT_016: "마일스톤은 목표일과 내용을 모두 입력해 주세요",
  PROJECT_020: "완료·삭제된 프로젝트는 수정할 수 없어요",
  PROJECT_021: "새 기간을 벗어나는 할 일·지출·회의록이 있어 기간을 줄일 수 없어요",
  PROJECT_022: "이미 삭제된 마일스톤이 있어요. 새로고침 후 다시 시도해 주세요",
  REQUEST_001: "입력값을 다시 확인해 주세요",
  REQUEST_029: "다른 사용자가 먼저 수정했어요. 새로고침 후 다시 시도해 주세요",
  USER_003: "퇴사한 사용자가 포함되어 있어요",
};

// 서버 검증(ProjectRequest)과 동일한 상한. 넘기기 전에 화면에서 막는다.
const MAX = {
  name: 100,
  description: 500,
  role: 20,
  milestoneGoal: 200,
  members: 100,
  milestones: 50,
} as const;

interface MemberRow {
  userId: number;
  name: string;
  // 부서 라벨. 상세 조회 응답에는 부서가 없어 수정 모드에서는 비어 있다
  team: string;
  role: string;
}

interface MilestoneRow extends MilestoneInput {
  // 화면에서 행을 구분하는 값. 서버로는 보내지 않는다.
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

interface ProjectCreateViewProps {
  // 값이 있으면 수정 모드 (없으면 생성)
  projectId?: string;
}

export default function ProjectCreateView({
  projectId,
}: ProjectCreateViewProps) {
  const isEdit = !!projectId;

  const router = useRouter();

  const openAgent = useAgentStore((state) => state.openAgent);
  const showToast = useToastStore((state) => state.showToast);

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

  const [milestones, setMilestones] = useState<MilestoneRow[]>([]);

  // 마일스톤 드래그 정렬 — 손잡이를 누른 행만 draggable이 된다(입력 선택 방해 방지)
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Query
  const { mutate: createProject, isPending: isCreating } =
    useCreateProjectMutation();
  const { mutate: updateProject, isPending: isUpdating } =
    useUpdateProjectMutation(projectId ?? "");

  // 수정 모드에서만 기존 값을 불러온다
  const { data: detail } = useProjectDetailQuery(projectId ?? "");

  // 생성 모드의 오너는 로그인 사용자다 (서버가 토큰으로 정하므로 화면은 보여주기만 한다)
  const { data: me } = useMyProfileQuery();

  const isPending = isCreating || isUpdating;

  // Effect — 수정 모드: 불러온 값으로 폼을 채운다
  useEffect(() => {
    if (!isEdit || !detail) return;

    setName(detail.name);
    setDescription(detail.description ?? "");
    setStartDate(detail.startDate);
    setEndDate(detail.endDate);
    setBudget(detail.budget === 0 ? "" : String(detail.budget));
    setNoBudgetLimit(detail.budget === 0);
    setOwnerRole(detail.owner.ownerRole ?? "");
    setMembers(
      detail.members.map((member) => ({
        userId: member.userId,
        name: member.name,
        // 목록 응답에 팀 정보가 없다
        team: "",
        role: member.role ?? "",
      })),
    );
    // milestoneId를 그대로 들고 있어야 완료 상태가 보존된다
    setMilestones(
      detail.milestones.map((ms) => ({
        key: `ms-${ms.milestoneId}`,
        milestoneId: ms.milestoneId,
        targetDate: ms.targetDate,
        goal: ms.goal,
      })),
    );
  }, [isEdit, detail]);

  // 참여자 검색 — 캘린더 인원 선택과 같은 훅(GET /users/search).
  // 디바운스·캐시·검색어 규칙(한글/영문만, 20자 이내)을 훅이 들고 있다.
  const { results: suggestions, searching } = useUserSearchQuery(memberKeyword);

  // 이미 담긴 사람은 검색 결과에서 숨긴다 — 오너 + 추가된 참여자.
  // 수정 모드의 오너는 서버가 준 값, 생성 모드는 나다.
  const ownerUserId = detail?.owner.userId ?? me?.userId;
  const ownerName = detail?.owner.name ?? me?.name ?? "";

  // 상세 응답에는 부서가 없다 — 생성 모드에서만 내 부서를 보여줄 수 있다.
  const ownerDepartment =
    isEdit || !me ? "" : DEPARTMENT_LABEL[me.department];

  const selectableSuggestions = suggestions.filter(
    (user) =>
      user.userId !== ownerUserId &&
      !members.some((member) => member.userId === user.userId),
  );

  // Event Handler
  // 목표일에는 minDate로 시작일 이전을 막아두지만, 시작일을 나중에 목표일 뒤로 옮기면
  // 이미 고른 목표일이 그대로 남아 뒤집힌 기간이 서버로 나간다 (PROJECT_003). 그래서 비운다.
  const handleStartDateChange = (next: string) => {
    setStartDate(next);
    if (endDate && next > endDate) setEndDate("");
  };

  // 숫자만 남기고 앞자리 0을 떼어낸다. 0은 서버에서 '제한 없음'을 뜻해서,
  // 금액으로 0을 적어 넣으면 의도와 다른 프로젝트가 만들어진다.
  // 제한이 없다는 뜻이면 옆의 '제한 없음' 버튼으로 밝히게 한다.
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBudget(e.target.value.replace(/[^\d]/g, "").replace(/^0+/, ""));
  };

  const addMember = (user: UserSearchResult) => {
    setMembers((prev) => {
      if (prev.some((m) => m.userId === user.userId)) return prev;
      if (prev.length >= MAX.members) return prev; // 참여자 상한

      return [
        ...prev,
        {
          userId: user.userId,
          name: user.name,
          team: DEPARTMENT_LABEL[user.department],
          role: "",
        },
      ];
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
    const body = {
      name,
      startDate,
      endDate,
      // 0 = 예산 제한 없음. '제한 없음'을 고른 경우에만 보낸다.
      budget: noBudgetLimit ? 0 : Number(budget),
      description,
      ownerRole: ownerRole || null,
      members: members.map((m) => ({ userId: m.userId, role: m.role || null })),
      // 수정 시 milestoneId를 함께 보내야 완료 상태가 보존된다.
      // 여기서 빠진 기존 마일스톤은 서버에서 삭제된다.
      milestones: milestones
        .filter((ms) => ms.targetDate && ms.goal)
        .map(({ milestoneId, targetDate, goal }) => ({
          milestoneId: milestoneId ?? null,
          targetDate,
          goal,
        })),
    };

    if (isEdit && detail) {
      updateProject(
        { version: detail.version, body },
        {
          // 개요로 돌아가면 화면만으로는 저장 여부를 알 수 없어 토스트로 알린다
          onSuccess: () => {
            showToast("프로젝트가 수정되었습니다");
            router.push(`/projects/${projectId}/overview`);
          },

          // 실패하면 이 화면에 남는다. 입력값을 그대로 두어야 고쳐서 다시 낼 수 있다.
          onError: (error) => {
            const code = getErrorCode(error);
            showToast(
              (code && UPDATE_ERROR_MESSAGE[code]) ||
                "프로젝트를 수정하지 못했어요",
              "danger",
            );
          },
        },
      );
      return;
    }

    createProject(body, {
      onSuccess: (data) =>
        router.push(`/projects/${data.result.projectId}/overview`),
    });
  };

  // 수정 모드는 기존 값을 불러온 뒤에야 저장할 수 있다 (version이 필요)
  const canSubmit =
    !!name.trim() &&
    !!startDate &&
    !!endDate &&
    // 제한 없음을 고르지 않았다면 금액을 1원 이상 적어야 한다
    (noBudgetLimit || Number(budget) >= 1) &&
    !isPending &&
    (!isEdit || !!detail);

  return (
    <main className={styles.container}>
      {/* 페이지 헤더 */}
      <div className={styles.pageHead}>
        <div className={styles.pageHeadText}>
          <h2 className={styles.pageTitle}>
            {isEdit ? "프로젝트 수정" : "프로젝트 생성"}
          </h2>
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
            type="light"
            buttonStyle="weak"
            size="medium"
            onClick={() => router.back()}
          >
            취소
          </Button>
          <Button
            size="medium"
            loading={isPending}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {isEdit ? "수정하기" : "생성하기"}
          </Button>
        </div>
      </div>

      {/* 기본 정보 */}
      <section className={styles.card}>
        <h3 className={styles.cardTitle}>기본 정보</h3>

        <div className={styles.fieldWrap}>
          <FormField
            label="프로젝트명"
            required
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
              onChange={handleStartDateChange}
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
              /* '제한 없음'을 골라도 표시를 유지한다 — 켤 때마다 사라졌다 나타나면
                 깜빡여 보이고, 필수 항목이라는 사실도 흐려진다.
                 '제한 없음'은 안 채우는 게 아니라 다른 방식으로 채우는 것이다. */
              required
              placeholder={noBudgetLimit ? "제한 없음" : ""}
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
                : "이름으로 참여자 추가"
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
                      <span className={styles.suggestName}>
                        {user.name} · {DEPARTMENT_LABEL[user.department]}
                      </span>

                      {/* 서버는 재직·휴직만 내려준다. 휴직자도 넣을 수는 있지만
                          당장 일을 맡길 수 없어, 고르기 전에 알 수 있게 표시한다 */}
                      {user.status === "ON_LEAVE" && (
                        <span className={styles.suggestLeave}>휴직</span>
                      )}
                    </button>
                  </li>
                ))
              ) : (
                /* 아직 요청 중인 구간까지 '없어요'로 보이면 사람이 없는 줄 안다 */
                <li className={styles.suggestEmpty}>
                  {searching ? "찾는 중이에요…" : "검색 결과가 없어요"}
                </li>
              )}
            </ul>
          )}
        </div>

        <div className={styles.memberGrid}>
          {/* 오너(생성자) — 제거 불가.
              다른 참여자의 제거(✕) 자리에 왕관을 둔다. 칸 구조가 같아 줄이 어긋나지 않고,
              "이 사람은 뺄 수 없다"는 것도 그 자리에서 바로 읽힌다. */}
          <div className={styles.memberCard}>
            {/* 수정 모드는 서버가 준 오너를, 생성 모드는 로그인 사용자를 쓴다.
                상세 응답에 부서가 없어 수정 모드에서는 이름만 보인다. */}
            <span className={styles.memberName}>{ownerName}</span>
            <span className={styles.memberTeam}>
              {ownerDepartment ? `· ${ownerDepartment}` : ""}
            </span>
            <input
              className={styles.roleInput}
              placeholder="역할"
              maxLength={MAX.role}
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
              {/* 부서를 모르면 구분자만 남으므로 아예 그리지 않는다 */}
              <span className={styles.memberTeam}>
                {member.team ? `· ${member.team}` : ""}
              </span>
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
            size="tiny"
            leftAccessory="+"
            disabled={milestones.length >= MAX.milestones}
            onClick={addMilestone}
          >
            마일스톤 추가
          </Button>
        </div>

        {milestones.length === 0 ? (
          <p className={styles.emptyText}>
            시기별 목표를 추가해 주세요.
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
