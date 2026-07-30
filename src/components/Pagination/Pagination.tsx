"use client";

import styles from "./Pagination.module.css";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

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
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="이전 페이지"
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
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="다음 페이지"
      >
        ›
      </button>
    </nav>
  );
}
