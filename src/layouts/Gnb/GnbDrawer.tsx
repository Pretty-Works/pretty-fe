"use client";

import { useEffect } from "react";

import Image from "next/image";
import Link from "next/link";

import { LuX } from "react-icons/lu";

import Logo from "@/assets/brand/logo.png";

import { cx } from "@/lib/cx";

import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

import { useProjectMenu } from "@/features/project/hooks/useProjectMenu";

import styles from "./GnbDrawer.module.css";

export interface DrawerMenuItem {
  /** 하위 메뉴를 어디에 펼칠지 고르는 기준. 라벨로 찾으면 문구만 바뀌어도 조용히 끊어진다 */
  key: string;
  label: string;
  path: string;
  active: boolean;
}

interface GnbDrawerProps {
  open: boolean;
  onClose: () => void;
  items: DrawerMenuItem[];
  /** 지금 보고 있는 프로젝트. 프로젝트 안이 아니면 null */
  projectId: string | null;
  activeSegment: string;
  /** 작성 중이면 이동을 막는 확인 — 상단 메뉴와 같은 규칙을 그대로 받는다 */
  guard: (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * 좁은 폭에서 가운데 메뉴를 대신하는 서랍.
 *
 * 오른쪽이 아니라 왼쪽에서 연다 — 오른쪽은 에이전트 패널이 밀고 들어오고
 * 알림 드롭다운도 그 자리에 펼쳐져서, 같은 방향이면 서로를 가린다.
 */
export default function GnbDrawer({
  open,
  onClose,
  items,
  projectId,
  activeSegment,
  guard,
}: GnbDrawerProps) {
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay}>
      {/* 뒤를 눌러도 닫힌다. 서랍 자체를 감싸지 않아야 안쪽 클릭이 새지 않는다 */}
      <button
        type="button"
        className={styles.scrim}
        onClick={onClose}
        aria-label="메뉴 닫기"
      />

      <nav className={styles.panel} aria-label="전체 메뉴">
        <div className={styles.head}>
          <Link href="/" onClick={guard("/")} className={styles.brand}>
            <Image src={Logo} alt="Pretty Works 홈" height={18} />
          </Link>

          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="메뉴 닫기"
          >
            <LuX size={20} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.body}>
          {items.map((item) => (
            <div key={item.key}>
              <Link
                href={item.path}
                onClick={(e) => {
                  guard(item.path)(e);
                  if (!e.defaultPrevented) onClose();
                }}
                aria-current={item.active ? "page" : undefined}
                className={cx(styles.item, item.active && styles.itemActive)}
              >
                {item.label}
              </Link>

              {/*
               * 프로젝트 하위 메뉴는 지금 프로젝트 안에 있을 때만 편다.
               * 항목 구성이 프로젝트마다 달라(권한·상태) 훅을 쓰는데, 훅은 조건부로
               * 부를 수 없어서 프로젝트가 있을 때만 붙는 자식 컴포넌트로 뺐다.
               */}
              {item.key === "projects" && projectId && (
                <ProjectSection
                  projectId={projectId}
                  activeSegment={activeSegment}
                  guard={guard}
                  onNavigate={onClose}
                />
              )}
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}

interface ProjectSectionProps {
  projectId: string;
  activeSegment: string;
  guard: (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onNavigate: () => void;
}

function ProjectSection({
  projectId,
  activeSegment,
  guard,
  onNavigate,
}: ProjectSectionProps) {
  const { items, projectName } = useProjectMenu(projectId, activeSegment);

  return (
    <div className={styles.sub}>
      {projectName && <span className={styles.subCaption}>{projectName}</span>}

      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          onClick={(e) => {
            guard(item.href)(e);
            if (!e.defaultPrevented) onNavigate();
          }}
          aria-current={item.active ? "page" : undefined}
          className={cx(
            styles.subItem,
            item.active && styles.itemActive,
            item.detached && styles.subItemDetached,
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
