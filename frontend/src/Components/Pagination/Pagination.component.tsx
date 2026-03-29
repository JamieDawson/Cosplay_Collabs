import React from "react";
import type { PaginationMeta } from "../../config/pagination";
import { buildPageNumbers } from "../../utils/paginationPages";

type Props = {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
  disabled?: boolean;
};

const Pagination: React.FC<Props> = ({
  pagination,
  onPageChange,
  className = "",
  disabled = false,
}) => {
  const { page, totalPages, total } = pagination;

  if (totalPages <= 1 || total === 0) {
    return null;
  }

  const items = buildPageNumbers(page, totalPages);
  const btnBase =
    "min-w-[2.25rem] h-9 px-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40";
  const inactive =
    "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300";
  const active =
    "bg-gradient-to-r from-sky-500 to-violet-600 text-white border border-transparent shadow-sm";

  return (
    <nav
      className={`flex flex-wrap items-center justify-center gap-2 py-6 ${className}`}
      aria-label="Page navigation"
    >
      <button
        type="button"
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(page - 1)}
        className={`${btnBase} ${inactive}`}
      >
        Previous
      </button>

      {items.map((item, idx) =>
        item === "gap" ? (
          <span
            key={`gap-${idx}`}
            className="px-1 text-gray-400 select-none"
            aria-hidden
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            disabled={disabled}
            onClick={() => onPageChange(item)}
            className={`${btnBase} ${item === page ? active : inactive}`}
            aria-current={item === page ? "page" : undefined}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        disabled={disabled || page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className={`${btnBase} ${inactive}`}
      >
        Next
      </button>

      <span className="w-full sm:w-auto text-center sm:text-left text-sm text-gray-500 sm:ml-3">
        Page {page} of {totalPages} · {total} post{total !== 1 ? "s" : ""}
      </span>
    </nav>
  );
};

export default Pagination;
