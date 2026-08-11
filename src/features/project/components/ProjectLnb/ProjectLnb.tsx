"use client";

import { Fragment } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useLeaveGuardStore } from "@/stores/useLeaveGuardStore";

import { useProjectMenu } from "@/features/project/hooks/useProjectMenu";

import styles from "./ProjectLnb.module.css";

export default function ProjectLnb() {
  const pathname = usePathname();
  const parts = pathname.split("/");
  const projectId = parts[2] ?? "";
  const activeSegment = parts[3] ?? "";

  // 무엇이 보이는지(생성·수정)는 햄버거 서랍과 같은 판정을 쓴다
  const { items } = useProjectMenu(projectId, activeSegment);

  // 작성 중인 화면(프로젝트 수정 등)에서 메뉴를 누르면 먼저 확인을 받는다.
  // 지금 주소 그대로면 나가는 게 아니므로 막지 않는다 — 활성 탭이라도
  // 하위 화면(게시글·회의록 작성)에서는 탭 루트로 돌아가는 실제 이탈이라 막아야 한다.
  const requestLeave = useLeaveGuardStore((state) => state.requestLeave);

  const guard =
    (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (pathname !== href && requestLeave(href)) e.preventDefault();
    };

  return (
    <nav className={styles.lnb} aria-label="프로젝트 메뉴">
      <span className={styles.caption}>프로젝트 메뉴</span>

      {items.map((item, index) => {
        // 이 프로젝트를 벗어나는 항목이 처음 나오는 자리에서 한 번만 가른다
        const startsDetached = item.detached && !items[index - 1]?.detached;

        return (
          <Fragment key={item.key}>
            {startsDetached && <hr className={styles.divider} />}

            <Link
              href={item.href}
              onClick={guard(item.href)}
              aria-current={item.active ? "page" : undefined}
              className={`${styles.item} ${item.active ? styles.active : ""}`}
            >
              {item.label}
            </Link>
          </Fragment>
        );
      })}
    </nav>
  );
}
