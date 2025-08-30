
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function UserTableFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
        <Label htmlFor="status-filter" className="text-sm font-medium">Status:</Label>
        <Select
            defaultValue={searchParams.get("status")?.toString() || "all"}
            onValueChange={handleFilterChange}
        >
        <SelectTrigger className="w-[180px]" id="status-filter">
            <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
        </Select>
    </div>
  );
}
