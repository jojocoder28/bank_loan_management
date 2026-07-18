"use client";

import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoanInterestBreakdown } from "../actions";
import { Calculator, Info, AlertTriangle, TrendingDown } from "lucide-react";
import Link from "next/link";

interface InterestBreakdownPopoverProps {
    loanBreakdown: LoanInterestBreakdown[];
    totalInterest: number;
    userId: string;
}

function formatDate(iso: string) {
    if (!iso) return "N/A";
    return new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export function InterestBreakdownPopover({
    loanBreakdown,
    totalInterest,
    userId,
}: InterestBreakdownPopoverProps) {
    if (loanBreakdown.length === 0) {
        return <span className="text-muted-foreground text-sm">₹0</span>;
    }

    return (
        <HoverCard openDelay={150} closeDelay={100}>
            <HoverCardTrigger asChild>
                <button className="group relative inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary cursor-help">
                    ₹{totalInterest.toLocaleString()}
                    <Info className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
            </HoverCardTrigger>

            <HoverCardContent side="right" align="start" className="w-[390px] p-0 shadow-xl border-primary/20 bg-background text-foreground z-50">
                <div className="flex items-center gap-2 px-4 py-3 bg-primary/5 border-b border-primary/10 rounded-t-lg">
                    <Calculator className="size-4 text-primary shrink-0" />
                    <div>
                        <p className="text-xs font-bold text-primary uppercase tracking-wide">Interest Calculation Breakdown</p>
                        <p className="text-[10px] text-muted-foreground">Formula: Outstanding Principal × Annual Rate ÷ 12</p>
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    {loanBreakdown.map((loan, idx) => {
                        const expectedInterest = Math.round(loan.outstandingPrincipal * (loan.interestRate / 100) / 12);
                        const mismatch = expectedInterest !== loan.monthlyInterest;

                        return (
                            <div key={loan.loanId} className="space-y-2.5">
                                {idx > 0 && <Separator />}

                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider">
                                        Loan {idx + 1}{loanBreakdown.length > 1 ? ` of ${loanBreakdown.length}` : ""}
                                    </Badge>
                                    <Link href={`/admin/users/${userId}`} className="text-[10px] text-primary hover:underline">
                                        View Loan →
                                    </Link>
                                </div>

                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Sanctioned:</span>
                                        <span className="font-medium">₹{loan.loanAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Issued:</span>
                                        <span className="font-medium">{formatDate(loan.issueDate)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Tenure:</span>
                                        <span className="font-medium">{loan.tenure} months</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Annual Rate:</span>
                                        <span className="font-semibold text-orange-600">{loan.interestRate}%</span>
                                    </div>
                                </div>

                                <div className="bg-muted/60 rounded-lg p-3 space-y-1.5">
                                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
                                        This Month&apos;s Interest Calculation
                                    </p>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Outstanding Principal</span>
                                        <span className="font-semibold text-blue-600 dark:text-blue-400">₹{loan.outstandingPrincipal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">× Annual Rate ÷ 12</span>
                                        <span className="font-semibold text-orange-600">× {loan.interestRate}% ÷ 12</span>
                                    </div>
                                    <Separator className="my-0.5 opacity-50" />
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span>= Monthly Interest</span>
                                        <span className="text-green-600 text-sm">₹{loan.monthlyInterest.toLocaleString()}</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-mono bg-background/60 px-2 py-1 rounded border border-border/50 mt-1">
                                        ₹{loan.outstandingPrincipal.toLocaleString()} × {loan.interestRate}/100 ÷ 12 ≈ ₹{loan.monthlyInterest.toLocaleString()}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground flex items-center gap-1">
                                        <TrendingDown className="size-3" />
                                        Monthly Principal EMI
                                    </span>
                                    <span className="font-medium">₹{loan.monthlyPrincipal.toLocaleString()}</span>
                                </div>

                                {mismatch && (
                                    <div className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-700 dark:text-red-400">
                                        <AlertTriangle className="size-3 shrink-0 mt-0.5" />
                                        <span>
                                            <strong>Possible mismatch:</strong> Expected ₹{expectedInterest.toLocaleString()} but showing ₹{loan.monthlyInterest.toLocaleString()}.
                                            This may indicate a custom override or data inconsistency.
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {loanBreakdown.length > 1 && (
                        <>
                            <Separator />
                            <div className="flex items-center justify-between text-sm font-bold">
                                <span>Total Interest (all loans)</span>
                                <span className="text-green-600">₹{totalInterest.toLocaleString()}</span>
                            </div>
                        </>
                    )}

                    <div className="pt-1 border-t border-border/40 flex items-start gap-1.5 text-[10px] text-muted-foreground">
                        <Info className="size-3 shrink-0 mt-0.5" />
                        <span>
                            If the interest looks wrong, click "View Loan →" to check the loan settings,
                            or use the Edit (pencil) button on this row to apply a correction for this month only.
                        </span>
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}
