"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { useAgentStore } from "@/stores/useAgentStore";

import Logo from "@/assets/brand/logo.png";
import AgentIcon from "@/assets/icons/menu/agent.svg";
import AlarmIcon from "@/assets/icons/menu/alarm.svg";

import styles from "./Gnb.module.css";

export default function Gnb() {
  const pathname = usePathname();
  const toggleFolded = useAgentStore((state) => state.toggleFolded);

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
            <AlarmIcon
              className={styles.icon}
              aria-label="alarm-icon"
            />

            <AgentIcon
              className={styles.icon}
              aria-label="agent-icon"
              onClick={toggleFolded}
            />
          </div>

          <hr className={styles.divider} />

          <div className={styles.profile}>
            김
          </div>
        </div>
      </div>
    </header>
  );
}