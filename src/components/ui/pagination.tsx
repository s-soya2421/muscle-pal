import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange?: (page: number) => void;
  className?: string;
};

export function Pagination({ page, pageCount, onPageChange, className }: PaginationProps) {
  const canPrev = page > 1;
  const canNext = page < pageCount;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  return (
    <nav className={cn("flex items-center justify-center gap-2", className)} aria-label="Pagination">
      <Button variant="outline" size="sm" disabled={!canPrev} onClick={() => onPageChange?.(page - 1)}>
        Prev
      </Button>
      {pages.map((p) => (
        <Button
          key={p}
          variant={p === page ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange?.(p)}
        >
          {p}
        </Button>
      ))}
      <Button variant="outline" size="sm" disabled={!canNext} onClick={() => onPageChange?.(page + 1)}>
        Next
      </Button>
    </nav>
  );
}
