"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LuChevronDown, LuX } from "react-icons/lu";

import Logo from "@/assets/brand/logo.png";

import { cx } from "@/lib/cx";

import StateView from "@/components/StateView/StateView";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

import { PROJECT_TABS } from "@/features/project/constants/projectTabs";
import { useProjectsQuery } from "@/features/project/hooks/queries/useProjectsQuery";
import { useCanCreateProject } from "@/features/project/hooks/useCanCreateProject";
import { useProjectMenu } from "@/features/project/hooks/useProjectMenu";

import styles from "./GnbDrawer.module.css";

/** 한 번에 받아 오는 프로젝트 수. 넘치면 목록 끝에서 홈으로 안내한다 */
const PICKER_SIZE = 20;

const CREATE_PROJECT_PATH = "/projects/new";

export interface DrawerMenuItem {
  /** 하위 메뉴를 어디에 펼칠지 고르는 기준. 라벨로 찾으면 문구만 바뀌어도 조용히 끊어진다 */
  key: string;
  label: string;
  path: string;
  active: boolean;
}

type Guard = (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => void;

interface GnbDrawerProps {
  open: boolean;
  onClose: () => void;
  items: DrawerMenuItem[];
  /** 지금 보고 있는 프로젝트. 프로젝트 안이 아니면 null */
  projectId: string | null;
  activeSegment: string;
  /** 작성 중이면 이동을 막는 확인 — 상단 메뉴와 같은 규칙을 그대로 받는다 */
  guard: Guard;
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
  /*
   * 프로젝트 하위를 펼쳐 둘지. 이미 어떤 프로젝트 안에 있으면 그 탭들을 바로 보여 주고,
   * 밖이라면 접어 둔다.
   * 서랍은 닫힐 때 언마운트되므로 다음에 열면 이 판단을 다시 한다.
   */
  const [projectsOpen, setProjectsOpen] = useState(projectId !== null);
  const canCreate = useCanCreateProject();

  // 생성 화면은 프로젝트 안이 아니라 이 항목 자체가 지금 자리다
  const pathname = usePathname();
  const createActive = pathname === CREATE_PROJECT_PATH;

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
          {items.map((item) => {
            /*
             * 프로젝트는 그 자체로 갈 수 있는 곳이 아니다 — 어느 탭인지까지 골라야 목적지가 된다.
             * 눌러서 바로 이동해 버리면 서랍이 닫히고, 게시판에 가려고 다시 열어야 한다.
             */
            if (item.key !== "projects") {
              return (
                <Link
                  key={item.key}
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
              );
            }

            return (
              <div key={item.key}>
                <button
                  type="button"
                  className={cx(
                    styles.item,
                    styles.itemToggle,
                    item.active && styles.itemActive,
                  )}
                  aria-expanded={projectsOpen}
                  onClick={() => setProjectsOpen((prev) => !prev)}
                >
                  <span className={styles.itemLabel}>{item.label}</span>
                  <LuChevronDown
                    size={16}
                    className={cx(
                      styles.chevron,
                      projectsOpen && styles.chevronOpen,
                    )}
                    aria-hidden="true"
                  />
                </button>

                {projectsOpen && (
                  <div className={styles.sub}>
                    {/* 특정 프로젝트에 속한 동작이 아니라 결이 다르다 — 목록에 섞지 않고 위에 둔다 */}
                    {canCreate && (
                      <div className={styles.subLead}>
                        <Link
                          href={CREATE_PROJECT_PATH}
                          onClick={(e) => {
                            guard(CREATE_PROJECT_PATH)(e);
                            if (!e.defaultPrevented) onClose();
                          }}
                          aria-current={createActive ? "page" : undefined}
                          className={cx(
                            styles.subItem,
                            createActive && styles.itemActive,
                          )}
                        >
                          프로젝트 생성
                        </Link>
                      </div>
                    )}

                    {/*
                     * 펼쳤을 때 무엇을 보여줄지는 지금 프로젝트 안인지에 따라 갈린다.
                     * 둘 다 훅을 쓰는데 훅은 조건부로 부를 수 없어 자식 컴포넌트로 갈라 뒀다.
                     */}
                    {projectId ? (
                      <ProjectSection
                        projectId={projectId}
                        activeSegment={activeSegment}
                        guard={guard}
                        onNavigate={onClose}
                      />
                    ) : (
                      <ProjectPicker guard={guard} onNavigate={onClose} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

interface SubListProps {
  guard: Guard;
  onNavigate: () => void;
}

/**
 * 아직 어느 프로젝트도 열지 않았을 때 고르는 자리.
 *
 * 진행 중인 것만 보여 준다 — GNB 가 기본 목적지를 정할 때 쓰는 기준과 같다.
 * 끝났거나 보관한 프로젝트를 찾아가는 일은 필터와 검색이 있는 홈에서 한다.
 */
function ProjectPicker({ guard, onNavigate }: SubListProps) {
  const { data, isLoading, isError } = useProjectsQuery({
    status: "ONGOING",
    page: 0,
    size: PICKER_SIZE,
  });

  /*
   * 펼쳐 둔 프로젝트. 프로젝트를 고르는 것만으로는 갈 곳이 정해지지 않는다 —
   * 개요로 바로 보내면 게시판에 가려던 사람은 서랍을 다시 열어야 한다.
   * 한 번에 하나만 편다: 여럿이 열려 있으면 어느 프로젝트의 탭인지 헷갈린다.
   */
  const [openId, setOpenId] = useState<string | null>(null);

  const projects = data?.projects ?? [];
  // 한 장에 다 안 들어왔다 — 여기서 다 보여주려 하지 말고 홈으로 보낸다
  const hasMore = (data?.totalPages ?? 0) > 1;

  return (
    <>
      <span className={styles.subCaption}>진행 중인 프로젝트</span>

      {/* 많이 참여한 사람은 이 목록만으로 서랍이 끝없이 길어진다 — 여기서만 스크롤한다 */}
      <div className={styles.subScroll}>
        <StateView
          loading={isLoading}
          error={isError}
          empty={projects.length === 0}
          size="compact"
          loadingText="목록을 불러오는 중이에요…"
          errorText="목록을 불러오지 못했어요."
          emptyText="진행 중인 프로젝트가 없어요."
        >
          {projects.map((project) => {
            const expanded = openId === project.id;

            return (
              <div key={project.id}>
                <button
                  type="button"
                  className={cx(styles.subItem, styles.subToggle)}
                  aria-expanded={expanded}
                  title={project.name}
                  onClick={() => setOpenId(expanded ? null : project.id)}
                >
                  <span className={styles.subItemLabel}>{project.name}</span>
                  <LuChevronDown
                    size={14}
                    className={cx(
                      styles.chevron,
                      expanded && styles.chevronOpen,
                    )}
                    aria-hidden="true"
                  />
                </button>

                {expanded && (
                  <div className={styles.tabList}>
                    {PROJECT_TABS.map((tab) => {
                      const href = `/projects/${project.id}/${tab.segment}`;

                      return (
                        <Link
                          key={tab.segment}
                          href={href}
                          onClick={(e) => {
                            guard(href)(e);
                            if (!e.defaultPrevented) onNavigate();
                          }}
                          className={styles.tabItem}
                        >
                          {tab.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </StateView>
      </div>

      {hasMore && (
        <Link
          href="/"
          onClick={(e) => {
            guard("/")(e);
            if (!e.defaultPrevented) onNavigate();
          }}
          className={styles.subMore}
        >
          홈에서 전체 보기
        </Link>
      )}
    </>
  );
}

interface ProjectSectionProps extends SubListProps {
  projectId: string;
  activeSegment: string;
}

function ProjectSection({
  projectId,
  activeSegment,
  guard,
  onNavigate,
}: ProjectSectionProps) {
  const { items, projectName } = useProjectMenu(projectId, activeSegment);

  // 생성은 이 프로젝트와 무관해서 위로 올려 뒀다 — 여기서 또 그리지 않는다
  const scoped = items.filter((item) => item.key !== "new");

  return (
    <>
      {projectName && <span className={styles.subCaption}>{projectName}</span>}

      {scoped.map((item) => (
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
          <span className={styles.subItemLabel}>{item.label}</span>
        </Link>
      ))}
    </>
  );
}
