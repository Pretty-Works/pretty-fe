"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";
import Image from "next/image";

import { LuBell } from "react-icons/lu";

import { usePathname } from "next/navigation";

import { useAgentStore } from "@/stores/useAgentStore";
import { useLogoutMutation } from "@/features/auth/login/hooks/mutations/useLogoutMutation";
import { useMyProfileQuery } from "@/features/user/hooks/queries/useMyProfileQuery";
import { POSITION_LABEL } from "@/features/user/api/userApi";
import { DEPARTMENT_LABEL } from "@/features/project/overview/api/taskBoardApi";

import Logo from "@/assets/brand/logo.png";
import AgentIcon from "@/assets/icons/menu/agent.svg";
import AlarmIcon from "@/assets/icons/menu/alarm.svg";

import styles from "./Gnb.module.css";

export default function Gnb() {
  const pathname = usePathname();
  const toggleFolded = useAgentStore((state) => state.toggleFolded);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { mutate: logout } = useLogoutMutation();
  const { data: me } = useMyProfileQuery();

  // 프로필 메뉴: 바깥 클릭·ESC로 닫기
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
      path: "/projects",
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
        {/* 왼쪽 */}
        <div className={styles.left}>
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
                  key={menu.path}
                  href={menu.path}
                  className={`${styles.menuItem} ${isActive ? styles.active : ""}`}
                >
                  {menu.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 오른쪽 */}
        <div className={styles.right}>
          {/* 알림/에이전트 */}
          <div className={styles.actions}>
            <LuBell
              className={styles.bell}
              aria-label="alarm-icon"
            />

            <AgentIcon
              className={styles.icon}
              aria-label="agent-icon"
              onClick={toggleFolded}
            />
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