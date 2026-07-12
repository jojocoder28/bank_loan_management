"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { approveLoan, rejectLoan } from "../actions";
import { Check, Loader2, X } from "lucide-react";
import Link from 'next/link';
import { ILoan } from "@/models/loan";
import { useToast } from "@/hooks/use-toast";
import { useTransition, useState } from "react";
import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface PopulatedLoan extends Omit<ILoan, 'user'> {
    _id: string;
    user: {
        _id: string;
        name: string;
        email: string;
        shareFund: number;
        guaranteedFund: number;
    }
}

const ApprovalButton = ({ loanId, action, children, variant, onAction, tooltip }: { loanId: string, action: (formData: FormData) => Promise<any>, children: React.ReactNode, variant: "default" | "destructive", onAction: (loanId: string) => void, tooltip: string }) => {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleAction = (formData: FormData) => {
        startTransition(async () => {
            const result = await action(formData);
            if (result.error) {
                toast({ variant: 'destructive', title: 'Action Failed', description: result.error });
            } else {
                toast({ title: 'Success', description: `Loan has been ${variant === 'default' ? 'approved' : 'rejected'}.` });
                window.dispatchEvent(new CustomEvent('approvalCountChanged'));
                onAction(loanId);
            }
        });
    };

    return (
        <form action={handleAction}>
            <input type="hidden" name="loanId" value={loanId} />
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Button size="sm" variant={variant} disabled={isPending} className="w-full md:w-auto">
                            {isPending ? <Loader2 className="mr-0 md:mr-2 size-4 animate-spin" /> : children}
                            <span className="hidden md:inline">{variant === 'default' ? 'Approve' : 'Reject'}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{tooltip}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </form>
    )
}

const ApproveLoanDialog = ({ loan, onAction }: { loan: PopulatedLoan, onAction: (loanId: string) => void }) => {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const now = new Date();
    const defaultMonth = loan.startMonth !== undefined ? loan.startMonth : now.getMonth();
    const defaultYear = loan.startYear !== undefined ? loan.startYear : now.getFullYear();

    const [startMonth, setStartMonth] = useState(defaultMonth.toString());
    const [startYear, setStartYear] = useState(defaultYear.toString());

    const handleApprove = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        startTransition(async () => {
            const result = await approveLoan(formData);
            if (result.error) {
                toast({ variant: 'destructive', title: 'Action Failed', description: result.error });
            } else {
                toast({ title: 'Success', description: 'Loan has been approved successfully.' });
                window.dispatchEvent(new CustomEvent('approvalCountChanged'));
                onAction(loan._id);
                setOpen(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="default" className="gap-1 w-full md:w-auto">
                    <Check className="size-4" />
                    <span className="hidden md:inline">Approve</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <form onSubmit={handleApprove}>
                    <input type="hidden" name="loanId" value={loan._id} />
                    <DialogHeader>
                        <DialogTitle>Approve Loan Application</DialogTitle>
                        <DialogDescription>
                            Review or modify the starting deduction month for <strong>{loan.user.name}</strong>'s loan.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="app-start-month">Starting Deduction Month</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <select
                                    id="app-start-month"
                                    name="startMonth"
                                    value={startMonth}
                                    onChange={(e) => setStartMonth(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer text-foreground"
                                    disabled={isPending}
                                >
                                    {Array.from({ length: 12 }).map((_, idx) => (
                                        <option key={idx} value={idx}>
                                            {new Date(2000, idx, 1).toLocaleString('default', { month: 'long' })}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    id="app-start-year"
                                    name="startYear"
                                    value={startYear}
                                    onChange={(e) => setStartYear(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer text-foreground"
                                    disabled={isPending}
                                >
                                    {Array.from({ length: 3 }).map((_, idx) => {
                                        const yr = now.getFullYear() + idx;
                                        return (
                                            <option key={yr} value={yr}>
                                                {yr}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <p className="text-[10px] text-muted-foreground text-left">
                                Calculations and statements for this loan will only process from this month onwards.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Approval
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function LoanApprovals({ pendingLoans: initialLoans }: { pendingLoans: PopulatedLoan[] }) {
    const [pendingLoans, setPendingLoans] = React.useState(initialLoans);
    
    const handleLoanAction = (loanId: string) => {
        setPendingLoans(currentLoans => currentLoans.filter(loan => loan._id !== loanId));
    };

    if (pendingLoans.length === 0) {
        return (
             <div className="text-center text-muted-foreground py-12">
                <p>There are no pending loan applications to review.</p>
            </div>
        )
    }

    return (
        <div className="w-full overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Applicant</TableHead>
                        <TableHead>Loan Amount</TableHead>
                        <TableHead>Monthly Payment</TableHead>
                        <TableHead>Tenure (Months)</TableHead>
                        <TableHead>Share Fund</TableHead>
                        <TableHead>Guaranteed Fund</TableHead>
                        <TableHead>Applied On</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pendingLoans.map((loan) => (
                        <TableRow key={loan._id}>
                            <TableCell className="font-medium">
                                <Link href={`/admin/users/${loan.user._id}`} className="text-primary hover:underline">
                                    {loan.user.name}
                                </Link>
                                <p className="text-xs text-muted-foreground">{loan.user.email}</p>
                            </TableCell>
                            <TableCell>₹{loan.loanAmount.toLocaleString()}</TableCell>
                            <TableCell>₹{(loan.monthlyPrincipalPayment ?? 0).toLocaleString()}</TableCell>
                            <TableCell>{loan.loanTenureMonths ? `${loan.loanTenureMonths} months` : 'N/A'}</TableCell>
                            <TableCell>₹{loan.user.shareFund.toLocaleString()}</TableCell>
                            <TableCell>₹{loan.user.guaranteedFund.toLocaleString()}</TableCell>
                            <TableCell suppressHydrationWarning>{new Date(loan.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <ApproveLoanDialog loan={loan} onAction={handleLoanAction} />
                                    <ApprovalButton loanId={loan._id} action={rejectLoan} variant="destructive" onAction={handleLoanAction} tooltip="Reject Loan">
                                        <X className="size-4" />
                                    </ApprovalButton>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
