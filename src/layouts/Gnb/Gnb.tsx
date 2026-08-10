"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import Logo from "@/assets/brand/logo.png";
import AgentActiveIcon from "@/assets/icons/menu/agent-active.svg";
import AgentIcon from "@/assets/icons/menu/agent.svg";

import { cx } from "@/lib/cx";

import { useClickOutside } from "@/hooks/useClickOutside";
import { useHydrated } from "@/hooks/useHydrated";

import { useAgentStore } from "@/features/agent/stores/useAgentStore";
import { useLogoutMutation } from "@/features/auth/login/hooks/mutations/useLogoutMutation";
import NotificationBell from "@/features/notification/components/NotificationBell/NotificationBell";
import { DEFAULT_PROJECT_TAB } from "@/features/project/constants/projectTabs";
import { useProjectsQuery } from "@/features/project/hooks/queries/useProjectsQuery";
import { useLastProjectStore } from "@/features/project/stores/useLastProjectStore";
import { describeAffiliation } from "@/features/user/constants/organization";
import { useMyProfileQuery } from "@/features/user/hooks/queries/useMyProfileQuery";

import styles from "./Gnb.module.css";

export default function Gnb() {
  const pathname = usePathname();
  const folded = useAgentStore((state) => state.folded);
  const toggleFolded = useAgentStore((state) => state.toggleFolded);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { mutate: logout } = useLogoutMutation();
  const { data: me } = useMyProfileQuery();

  // '프로젝트'는 마지막으로 보던 프로젝트로 되돌아가되, 항상 개요부터 연다.
  const lastProjectId = useLastProjectStore((state) => state.projectId);

  const hydrated = useHydrated();

  // 기억해둔 게 없을 때(첫 로그인·기억하던 프로젝트가 삭제됨) 대신 갈 곳.
  const needsFallback = hydrated && !lastProjectId;
  const { data: fallback } = useProjectsQuery(
    { status: "ONGOING", page: 0, size: 1 },
    needsFallback,
  );

  const fallbackProjectId = fallback?.projects[0]?.id;

  // 참여 중인 프로젝트가 하나도 없으면 갈 곳이 없다 — 목록이 있는 홈으로 보낸다.
  const targetProjectId =
    (hydrated ? lastProjectId : null) ??
    (needsFallback ? fallbackProjectId : null);

  const projectPath = targetProjectId
    ? `/projects/${targetProjectId}/${DEFAULT_PROJECT_TAB}`
    : "/";

  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const menuItems = [
    { label: "홈", path: "/", paths: ["/"] },
    // 활성 표시는 목적지가 아니라 지금 어디에 있는지로 판단한다
    { label: "프로젝트", path: projectPath, paths: ["/projects"] },
    { label: "캘린더", path: "/calendar", paths: ["/calendar"] },
  ];

  return (
    <header className={styles.gnb}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <Link href="/">
            <Image src={Logo} alt="Pretty Works 홈" priority />
          </Link>
        </div>

        <nav className={styles.menu} aria-label="주요 메뉴">
          {menuItems.map((menu) => {
            const isActive = menu.paths.some((path) =>
              path === "/" ? pathname === "/" : pathname.startsWith(path),
            );

            return (
              <Link
                key={menu.label}
                href={menu.path}
                className={cx(styles.menuItem, isActive && styles.active)}
                aria-current={isActive ? "page" : undefined}
              >
                {menu.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.right}>
          <div className={styles.actions}>
            <NotificationBell />

            <button
              type="button"
              className={styles.agentBtn}
              onClick={toggleFolded}
              aria-pressed={!folded}
              aria-label={folded ? "에이전트 패널 열기" : "에이전트 패널 닫기"}
            >
              {folded ? (
                <AgentIcon className={styles.agent} aria-hidden="true" />
              ) : (
                <AgentActiveIcon className={styles.agent} aria-hidden="true" />
              )}
            </button>
          </div>

          <hr className={styles.divider} />

          <div className={styles.profileWrap} ref={menuRef}>
            <button
              type="button"
              className={styles.profile}
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              aria-label="프로필 메뉴"
            >
              {me?.name.charAt(0) ?? ""}
            </button>

            {menuOpen && (
              <div className={styles.dropdown}>
                <div className={styles.profileInfo}>
                  <p className={styles.profileName}>{me?.name ?? "—"}</p>
                  <p className={styles.profileMeta}>
                    {me ? describeAffiliation(me) : "불러오는 중…"}
                  </p>
                </div>

                {me && (
                  <>
                    <hr className={styles.dropdownDivider} />

                    <dl className={styles.facts}>
                      <div className={styles.factRow}>
                        <dt className={styles.factLabel}>사번</dt>
                        <dd className={styles.factValue}>{me.employeeNo}</dd>
                      </div>

                      {me.email && (
                        <div className={styles.factRow}>
                          <dt className={styles.factLabel}>메일</dt>
                          <dd className={styles.factValue} title={me.email}>
                            {me.email}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </>
                )}

                <hr className={styles.dropdownDivider} />

                <button
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                >
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
