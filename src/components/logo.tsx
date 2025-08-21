import { cn } from "@/lib/utils";
import { Landmark } from "lucide-react";

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 font-semibold text-lg text-sidebar-foreground",
        className
      )}
    >
      <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <Landmark className="size-5" />
      </div>
      <span className="truncate group-data-[collapsible=icon]:hidden">
        CoopLoan Manager
      </span>
    </div>
  );
}
