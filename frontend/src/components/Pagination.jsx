import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const showMax = 5;

    if (totalPages <= showMax) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + showMax - 1);

      if (end === totalPages) {
        start = Math.max(1, end - showMax + 1);
      }

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50 transition-colors"
      >
        <ChevronLeft size={20} />
      </button>

      {pageNumbers.map((page, index) => (
        <button
          key={index}
          onClick={() => (typeof page === "number" ? onPageChange(page) : null)}
          disabled={typeof page !== "number"}
          className={`w-10 h-10 rounded-lg border transition-colors ${
            currentPage === page
              ? "bg-primary text-white border-primary"
              : page === "..."
                ? "border-transparent cursor-default"
                : "border-gray-200 hover:bg-gray-50"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50 transition-colors"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default Pagination;
