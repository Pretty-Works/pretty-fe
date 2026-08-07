"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";
import Image from "next/image";

import { usePathname } from "next/navigation";

import { useAgentStore } from "@/stores/useAgentStore";
import { useLastProjectStore } from "@/stores/useLastProjectStore";
import { useProjectsQuery } from "@/features/home/hooks/queries/useProjectsQuery";
import { DEFAULT_PROJECT_TAB } from "@/features/project/constants/projectTabs";
import { useLogoutMutation } from "@/features/auth/login/hooks/mutations/useLogoutMutation";
import { useMyProfileQuery } from "@/features/user/hooks/queries/useMyProfileQuery";
import { POSITION_LABEL } from "@/features/user/api/userApi";
import { DEPARTMENT_LABEL } from "@/features/project/overview/api/taskBoardApi";
import NotificationBell from "@/features/notification/components/NotificationBell/NotificationBell";

import Logo from "@/assets/brand/logo.png";
import AgentIcon from "@/assets/icons/menu/agent.svg";
import AgentActiveIcon from "@/assets/icons/menu/agent-active.svg";

import styles from "./Gnb.module.css";

export default function Gnb() {
  const pathname = usePathname();
  const folded = useAgentStore((state) => state.folded);
  const toggleFolded = useAgentStore((state) => state.toggleFolded);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { mutate: logout } = useLogoutMutation();
  const { data: me } = useMyProfileQuery();

  // '프로젝트'는 마지막으로 보던 프로젝트로 되돌아가되, 항상 개요부터 연다 —
  // 상단바는 프로젝트로 '들어가는' 입구라 보던 탭을 이어보는 자리가 아니다.
  const lastProjectId = useLastProjectStore((state) => state.projectId);

  // localStorage 값이라 서버 렌더에는 없다. 마운트 뒤에 꺼내 써야 첫 그림이 어긋나지 않는다.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  // 기억해둔 게 없을 때(첫 로그인·기억하던 프로젝트가 삭제됨) 대신 갈 곳.
  // 홈 목록의 맨 위 한 건만 받는다. 정렬은 홈과 같게 서버가 정한 순서를 그대로 쓴다.
  const needsFallback = hydrated && !lastProjectId;
  const { data: fallback } = useProjectsQuery(
    { status: "ONGOING", page: 0, size: 1 },
    needsFallback,
  );

  const fallbackProjectId = fallback?.projects[0]?.id;

  // 참여 중인 프로젝트가 하나도 없으면 갈 곳이 없다 — 목록이 있는 홈으로 보낸다.
  const targetProjectId =
    (hydrated ? lastProjectId : null) ?? (needsFallback ? fallbackProjectId : null);

  const projectPath = targetProjectId
    ? `/projects/${targetProjectId}/${DEFAULT_PROJECT_TAB}`
    : "/";

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const menuItems = [
    {
      label: "홈",
      path: "/",
      paths: ["/"],
    },
    {
      label: "프로젝트",
      path: projectPath,
      // 활성 표시는 목적지가 아니라 지금 어디에 있는지로 판단한다
      paths: ["/projects"],
    },
    {
      label: "캘린더",
      path: "/calendar",
      paths: ["/calendar"],
    },
  ];

  return (
    <header className={styles.gnb}>
      <div className={styles.container}>
        {/* 로고 */}
        <div className={styles.brand}>
          <Link href="/">
            <Image
              src={Logo}
              alt="pretty-works-logo"
            />
          </Link>
        </div>

        {/* 메뉴 */}
        <nav className={styles.menu}>
          {menuItems.map((menu) => {
            const isActive = menu.paths.some((path) =>
              path === "/"
                ? pathname === "/"
                : pathname.startsWith(path)
            );

            return (
              <Link
                /* 목적지가 바뀌어도(마지막 프로젝트) 같은 메뉴로 남게 라벨을 키로 쓴다 */
                key={menu.label}
                href={menu.path}
                className={`${styles.menuItem} ${isActive ? styles.active : ""}`}
              >
                {menu.label}
              </Link>
            );
          })}
        </nav>

        {/* 오른쪽 */}
        <div className={styles.right}>
          {/* 알림/에이전트 */}
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
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="프로필 메뉴"
            >
              {/* 이름 첫 글자를 아바타로 쓴다 */}
              {me?.name.charAt(0) ?? ""}
            </button>

            {menuOpen && (
              <div className={styles.dropdown} role="menu">
                {/* 내 정보 — 별도 화면이 없어 여기서만 확인한다 */}
                <div className={styles.profileInfo}>
                  <p className={styles.profileName}>{me?.name ?? "—"}</p>
                  <p className={styles.profileMeta}>
                    {me
                      ? `${DEPARTMENT_LABEL[me.department]} · ${POSITION_LABEL[me.position]}`
                      : "불러오는 중…"}
                  </p>
                </div>

                {me && (
                  <>
                    <hr className={styles.dropdownDivider} />

                    {/* 라벨 폭을 고정해 값이 한 열에 선다 */}
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
                  role="menuitem"
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