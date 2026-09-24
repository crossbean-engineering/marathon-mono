import { useState } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  currentPage,
  totalPages,
  total,
  onPageChange,
  disabled,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: PaginationProps) {
  const [jumpValue, setJumpValue] = useState('');

  if (totalPages <= 1 && !onPageSizeChange) return null;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const handleJump = () => {
    const page = parseInt(jumpValue, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      goToPage(page);
      setJumpValue('');
    }
  };

  const handleJumpKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleJump();
  };

  return (
    <div className="px-6 py-4 border-t border-border bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground font-semibold">
          Showing page {currentPage} of {totalPages} ({total} total)
        </span>

        {onPageSizeChange && pageSize && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              disabled={disabled}
              className="px-2 py-1 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-olive disabled:opacity-50"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Jump to page */}
        {totalPages > 5 && (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpValue}
              onChange={(e) => setJumpValue(e.target.value)}
              onKeyDown={handleJumpKeyDown}
              placeholder="Page"
              disabled={disabled}
              className="w-16 px-2 py-1 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-olive disabled:opacity-50"
            />
            <button
              onClick={handleJump}
              disabled={disabled || !jumpValue}
              className="px-2 py-1 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Go
            </button>
          </div>
        )}

        {/* Page navigation */}
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1 || disabled}
          className="px-3 py-1 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div className="flex gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => goToPage(pageNum)}
                disabled={disabled}
                className={`px-3 py-1 border rounded-lg text-sm font-medium transition-colors ${
                  currentPage === pageNum
                    ? 'bg-olive text-white border-olive'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages || disabled}
          className="px-3 py-1 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}