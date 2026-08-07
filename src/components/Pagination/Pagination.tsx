"use client";

import styles from "./Pagination.module.css";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
}

// 한 번에 보여줄 페이지 번호 개수. 전부 그리면 패널 폭을 넘긴다.
// 슬라이딩 대신 10개 묶음(1~10, 11~20)으로 끊어 번호가 제자리를 지키게 한다.
const PAGE_BLOCK = 10;

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  // 현재 페이지가 속한 묶음만 그린다. 화살표는 묶음 단위로 건너뛴다 (1 → 11 → 21).
  const blockStart =
    Math.floor((currentPage - 1) / PAGE_BLOCK) * PAGE_BLOCK + 1;
  const blockEnd = Math.min(blockStart + PAGE_BLOCK - 1, totalPages);

  const pages = Array.from(
    { length: Math.max(0, blockEnd - blockStart + 1) },
    (_, i) => blockStart + i,
  );

  const goTo = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange?.(page);
  };

  return (
    <nav
      className={styles.pagination}
      role="navigation"
      aria-label="페이지네이션"
    >
      <button
        type="button"
        className={`${styles.item} ${styles.arrow}`}
        onClick={() => goTo(blockStart - PAGE_BLOCK)}
        disabled={blockStart === 1}
        aria-label={`이전 ${PAGE_BLOCK}페이지`}
      >
        ‹
      </button>

      {pages.map((page) => {
        const isActive = page === currentPage;

        return (
          <button
            key={page}
            type="button"
            className={`${styles.item} ${isActive ? styles.active : ""}`}
            onClick={() => goTo(page)}
            aria-current={isActive ? "page" : undefined}
          >
            {page}
          </button>
        );
      })}

      <button
        type="button"
        className={`${styles.item} ${styles.arrow}`}
        onClick={() => goTo(blockStart + PAGE_BLOCK)}
        disabled={blockEnd >= totalPages}
        aria-label={`다음 ${PAGE_BLOCK}페이지`}
      >
        ›
      </button>
    </nav>
  );
}