"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function DateSelector({
    day,
    month,
    year,
    onDayChange,
    onMonthChange,
    onYearChange,
    dayError,
    monthError,
    yearError,
}: {
    day: string,
    month: string,
    year: string,
    onDayChange: (value: string) => void,
    onMonthChange: (value: string) => void,
    onYearChange: (value: string) => void,
    dayError?: string,
    monthError?: string,
    yearError?: string,
}) {

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 70 }, (_, i) => currentYear - i);
    const months = [
        { value: "1", label: "January" },
        { value: "2", label: "February" },
        { value: "3", label: "March" },
        { value: "4", label: "April" },
        { value: "5", label: "May" },
        { value: "6", label: "June" },
        { value: "7", label: "July" },
        { value: "8", label: "August" },
        { value: "9", label: "September" },
        { value: "10", label: "October" },
        { value: "11", label: "November" },
        { value: "12", label: "December" },
    ];
    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    return (
        <div className="space-y-2">
            <Label>Joining Date</Label>
            <div className="grid grid-cols-3 gap-2">
                <div>
                    <Select name="joinDay" value={day} onValueChange={onDayChange} required>
                        <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
                        <SelectContent>
                            {days.map(d => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     {dayError && <p className="text-sm text-destructive mt-1">{dayError}</p>}
                </div>
                <div>
                    <Select name="joinMonth" value={month} onValueChange={onMonthChange} required>
                        <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                        <SelectContent>
                            {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {monthError && <p className="text-sm text-destructive mt-1">{monthError}</p>}
                </div>
                <div>
                    <Select name="joinYear" value={year} onValueChange={onYearChange} required>
                        <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {yearError && <p className="text-sm text-destructive mt-1">{yearError}</p>}
                </div>
            </div>
        </div>
    );
}