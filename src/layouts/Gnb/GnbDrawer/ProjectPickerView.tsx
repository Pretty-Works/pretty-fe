"use client";

import { useState } from "react";

import Link from "next/link";
import { LuChevronDown } from "react-icons/lu";

import { cx } from "@/lib/cx";
import StateView from "@/components/StateView/StateView";
import type { Project } from "@/features/project/api/projectListApi";
import { PROJECT_TABS } from "@/features/project/constants/projectTabs";
import type { Guard } from "@/layouts/Gnb/GnbDrawer/GnbDrawer";

import styles from "./GnbDrawer.module.css";

export default function ProjectPickerView({
  projects,
  hasMore,
  isLoading,
  isError,
  guard,
  onNavigate,
}: {
  projects: Project[];
  hasMore: boolean;
  isLoading: boolean;
  isError: boolean;
  guard: Guard;
  onNavigate: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <span className={styles.subCaption}>진행 중인 프로젝트</span>
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
                    className={cx(styles.chevron, expanded && styles.chevronOpen)}
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
                          onClick={(event) => {
                            guard(href)(event);
                            if (!event.defaultPrevented) onNavigate();
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
          onClick={(event) => {
            guard("/")(event);
            if (!event.defaultPrevented) onNavigate();
          }}
          className={styles.subMore}
        >
          홈에서 전체 보기
        </Link>
      )}
    </>
  );
}
