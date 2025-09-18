import { Button } from "./Button";
import { ChevronLeft,ChevronRight } from "lucide-react";
export const Pagination = ({ currentPage, totalPages, onPageChange, hasNext, hasPrev }) => (
  <div className="flex items-center justify-center gap-2">
    <Button
      variant="ghost"
      onClick={() => onPageChange(currentPage - 1)}
      disabled={!hasPrev}
    >
      <ChevronLeft size={16} />
      Previous
    </Button>

    <div className="flex items-center gap-2">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-10 h-10 rounded-lg font-medium transition-colors ${page === currentPage
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
          {page}
        </button>
      ))}
    </div>

    <Button
      variant="ghost"
      onClick={() => onPageChange(currentPage + 1)}
      disabled={!hasNext}
    >
      Next
      <ChevronRight size={16} />
    </Button>
  </div>
);