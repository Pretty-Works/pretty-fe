"use client";

import Link from "next/link";

import { cx } from "@/lib/cx";
import type { ProjectMenuItem } from "@/features/project/hooks/useProjectMenu";
import type { Guard } from "@/layouts/Gnb/GnbDrawer/GnbDrawer";

import styles from "./GnbDrawer.module.css";

export default function ProjectSectionView({
  items,
  projectName,
  guard,
  onNavigate,
}: {
  items: ProjectMenuItem[];
  projectName: string;
  guard: Guard;
  onNavigate: () => void;
}) {
  return (
    <>
      {projectName && <span className={styles.subCaption}>{projectName}</span>}
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          onClick={(event) => {
            guard(item.href)(event);
            if (!event.defaultPrevented) onNavigate();
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
