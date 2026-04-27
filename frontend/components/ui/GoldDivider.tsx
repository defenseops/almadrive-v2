import { cn } from "@/lib/utils";

export default function GoldDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="h-px flex-1 bg-dark-400" />
      <div className="w-2 h-2 rotate-45 bg-gold" />
      <div className="h-px flex-1 bg-dark-400" />
    </div>
  );
}
