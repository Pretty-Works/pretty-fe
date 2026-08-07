"use client";

import { useRef, useState } from "react";

import { useClickOutside } from "@/hooks/useClickOutside";
import { DEPARTMENT_LABEL } from "@/features/project/overview/api/taskBoardApi";
import { POSITION_LABEL } from "@/features/user/api/userApi";
import type { ProjectMember } from "@/features/project/api/projectMemberApi";

import styles from "./AssigneePicker.module.css";

interface AssigneePickerProps {
  label: string;
  members: ProjectMember[];
  /** 담당자 userId (문자열) */
  value: string;
  onChange: (userId: string) => void;
  /** 내 userId — 목록에서 '(나)'를 붙인다 */
  myId: string;
  placeholder?: string;
}

// 담당자 고르기. SelectField를 쓰지 않는 이유는 네이티브 <select>의 <option>에
// 부서·역할·휴직 뱃지를 넣을 수 없어서다. 생김새는 다른 칸과 맞춘다.
export default function AssigneePicker({
  label,
  members,
  value,
  onChange,
  myId,
  placeholder = "담당자를 선택하세요",
}: AssigneePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // 바깥 클릭 시 닫기.
  // 훅이 그 클릭을 여기서 끝내 준다 — 모달 안이라 오버레이까지 닿으면 모달째 닫힌다.
  useClickOutside(rootRef, () => setOpen(false), open);

  const selected = members.find((member) => String(member.userId) === value);

  const nameOf = (member: ProjectMember) =>
    String(member.userId) === myId ? `${member.name} (나)` : member.name;

  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>

      <div className={styles.root} ref={rootRef}>
        <button
          type="button"
          className={styles.control}
          onClick={() => setOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {selected ? (
            <span className={styles.value}>
              <span className={styles.valueName}>{nameOf(selected)}</span>
              <span className={styles.valueMeta}>
                {DEPARTMENT_LABEL[selected.department]} ·{" "}
                {POSITION_LABEL[selected.position]}
              </span>
            </span>
          ) : (
            <span className={styles.placeholder}>{placeholder}</span>
          )}

          <span className={styles.caret} aria-hidden="true" />
        </button>

        {open && (
          <ul className={styles.popup} role="listbox">
            {members.map((member) => {
              const id = String(member.userId);
              const isSelected = id === value;

              return (
                <li key={id}>
                  <button
                    type="button"
                    className={`${styles.option} ${isSelected ? styles.optionOn : ""}`}
                    onClick={() => {
                      onChange(id);
                      setOpen(false);
                    }}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className={styles.name}>{nameOf(member)}</span>

                    <span className={styles.meta}>
                      {DEPARTMENT_LABEL[member.department]} ·{" "}
                      {POSITION_LABEL[member.position]}
                    </span>

                    {/* 프로젝트 안에서 맡은 역할. 지정하지 않았으면 자리를 비운다 */}
                    {member.role && (
                      <span className={styles.role}>{member.role}</span>
                    )}

                    {member.status === "ON_LEAVE" && (
                      <span className={styles.leave}>휴직</span>
                    )}

                    {member.isOwner && (
                      <span className={styles.owner}>책임자</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
