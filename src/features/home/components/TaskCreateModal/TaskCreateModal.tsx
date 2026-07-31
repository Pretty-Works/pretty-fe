"use client";

import { useEffect, useState } from "react";

import Button from "@/components/Button/Button";
import Modal from "@/components/Modal/Modal";
import FormField from "@/components/FormField/FormField";
import DatePicker from "@/components/DatePicker/DatePicker";

import { useCreateTaskMutation } from "@/features/home/hooks/mutations/useCreateTaskMutation";
import {
  fetchProjectPeriod,
  type Project,
  type ProjectPeriod,
} from "@/features/home/api/homeApi";

import styles from "./TaskCreateModal.module.css";

// 서버 검증과 동일한 상한 (content 100자)
const MAX_CONTENT = 100;

interface TaskCreateModalProps {
  open: boolean;
  onClose: () => void;
  projects: Project[];
  // 프로젝트가 이미 정해진 화면(개요)에서 열 때. 선택·개인 전환이 막힌다.
  fixedProject?: { id: string; name: string };
}

export default function TaskCreateModal({
  open,
  onClose,
  projects,
  fixedProject,
}: TaskCreateModalProps) {
  // State
  const [isPersonal, setIsPersonal] = useState(false); // 개인 할 일(프로젝트 없음)
  const [projectId, setProjectId] = useState(fixedProject?.id ?? "");
  const [content, setContent] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [period, setPeriod] = useState<ProjectPeriod | null>(null);

  // Query
  const { mutate: createTask, isPending } = useCreateTaskMutation();

  // Effect — 프로젝트가 바뀌면 기간을 받아와 마감일 선택 범위를 정한다
  useEffect(() => {
    let alive = true;

    if (isPersonal || !projectId) {
      setPeriod(null);
      return;
    }

    fetchProjectPeriod(projectId).then((result) => {
      if (!alive) return;

      setPeriod(result);
      // 이미 고른 마감일이 새 프로젝트 기간 밖이면 비운다
      setDueDate((prev) => {
        if (!prev || !result) return prev;
        return prev < result.startDate || prev > result.targetDate ? "" : prev;
      });
    });

    return () => {
      alive = false;
    };
  }, [projectId, isPersonal]);

  // Effect — 고정 모드로 열리면 그 프로젝트로 맞춘다
  useEffect(() => {
    if (open && fixedProject) setProjectId(fixedProject.id);
  }, [open, fixedProject]);

  // Event Handler
  const resetAndClose = () => {
    setIsPersonal(false);
    setProjectId(fixedProject?.id ?? "");
    setContent("");
    setDueDate("");
    setPeriod(null);
    onClose();
  };

  const togglePersonal = () => {
    setIsPersonal((prev) => {
      if (!prev) setProjectId(""); // 개인으로 바꾸면 프로젝트 선택 해제
      return !prev;
    });
  };

  const handleSubmit = () => {
    createTask(
      {
        content: content.trim(),
        projectId: isPersonal || !projectId ? null : Number(projectId),
        dueDate,
      },
      { onSuccess: resetAndClose },
    );
  };

  // 마감일은 필수, 할 일 이름도 필수. 프로젝트는 선택.
  const canSubmit = !!content.trim() && !!dueDate && !isPending;

  // 완료·중단 프로젝트에는 할 일을 추가할 수 없다 (PROJECT_020)
  const selectableProjects = projects.filter(
    (project) => project.status === "ONGOING" || project.status === "HOLDING",
  );

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title="할 일 추가"
      subtitle={
        fixedProject
          ? undefined
          : "프로젝트에 속하지 않는 개인 할 일도 등록할 수 있어요"
      }
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
        {/* 프로젝트 — 고정 모드면 바꿀 수 없고, 아니면 선택 + 개인 전환 */}
        {fixedProject ? (
          <FormField label="프로젝트" value={fixedProject.name} readOnly />
        ) : (
          <div className={styles.field}>
            <span className={styles.label}>프로젝트</span>
            <div className={styles.projectRow}>
              <select
                className={styles.select}
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={isPersonal}
              >
                <option value="">
                  {isPersonal ? "개인 할 일" : "프로젝트를 선택하세요"}
                </option>
                {selectableProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className={[styles.personal, isPersonal && styles.personalOn]
                  .filter(Boolean)
                  .join(" ")}
                onClick={togglePersonal}
                aria-pressed={isPersonal}
              >
                개인
              </button>
            </div>
          </div>
        )}

        <div className={styles.field}>
          <FormField
            label="할 일"
            required
            placeholder="예: 검색 API 커서 전환"
            maxLength={MAX_CONTENT}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          {content.length >= MAX_CONTENT && (
            <p className={styles.warn}>
              할 일 이름은 최대 {MAX_CONTENT}자까지 입력할 수 있어요.
            </p>
          )}
        </div>

        <div className={styles.field}>
          <DatePicker
            label="마감일"
            required
            value={dueDate}
            onChange={setDueDate}
            /* 프로젝트 할 일이면 그 프로젝트 기간 안에서만 고를 수 있다 */
            minDate={period?.startDate}
            maxDate={period?.targetDate}
            placeholder="날짜를 선택하세요"
          />
          {period && (
            <p className={styles.hint}>
              선택한 프로젝트 기간({period.startDate} ~ {period.targetDate}) 안에서만
              고를 수 있어요.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
