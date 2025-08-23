import { cn } from "@/lib/utils";

export function Skeleton({ className = "h-6 w-full" }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-muted", className)} />;
}
