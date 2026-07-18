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
import { Input } from "@/components/ui/input";
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
    };
    calculatedShortfall?: {
        share: number;
        guaranteed: number;
    };
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
    const [loanAmount, setLoanAmount] = useState(loan.loanAmount);
    const [shareFundTopUp, setShareFundTopUp] = useState(loan.calculatedShortfall?.share || 0);
    const [guaranteedFundTopUp, setGuaranteedFundTopUp] = useState(loan.calculatedShortfall?.guaranteed || 0);
    const [monthlyPrincipalPayment, setMonthlyPrincipalPayment] = useState(loan.monthlyPrincipalPayment || 0);
    const [allowExceeding, setAllowExceeding] = useState(false);

    const approvedPrincipal = Number(loanAmount) + Number(shareFundTopUp) + Number(guaranteedFundTopUp);
    const approvedTenure = monthlyPrincipalPayment > 0 ? Math.ceil(approvedPrincipal / Number(monthlyPrincipalPayment)) : 0;

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
                setAllowExceeding(false);
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
            <DialogContent className="sm:max-w-[450px]">
                <form onSubmit={handleApprove}>
                    <input type="hidden" name="loanId" value={loan._id} />
                    <DialogHeader>
                        <DialogTitle>Approve Loan Application</DialogTitle>
                        <DialogDescription>
                            Review or modify the loan parameters and starting deduction date for <strong>{loan.user.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                        <div className="grid gap-1">
                            <Label htmlFor="app-loan-amount">Requested Loan Amount (₹)</Label>
                            <Input
                                id="app-loan-amount"
                                name="loanAmount"
                                type="number"
                                value={loanAmount}
                                onChange={(e) => setLoanAmount(Number(e.target.value))}
                                required
                                disabled={isPending}
                            />
                        </div>

                        <div className="grid gap-1">
                            <Label htmlFor="app-share-topup" className="flex justify-between">
                                <span>Share Fund Top-Up (₹)</span>
                                <span className="text-[10px] text-muted-foreground">Min suggested: ₹{(loan.calculatedShortfall?.share || 0).toLocaleString()}</span>
                            </Label>
                            <Input
                                id="app-share-topup"
                                name="shareFundTopUp"
                                type="number"
                                value={shareFundTopUp}
                                onChange={(e) => setShareFundTopUp(Number(e.target.value))}
                                required
                                disabled={isPending}
                            />
                        </div>

                        <div className="grid gap-1">
                            <Label htmlFor="app-guaranteed-topup" className="flex justify-between">
                                <span>Guaranteed Fund Top-Up (₹)</span>
                                <span className="text-[10px] text-muted-foreground">Min suggested: ₹{(loan.calculatedShortfall?.guaranteed || 0).toLocaleString()}</span>
                            </Label>
                            <Input
                                id="app-guaranteed-topup"
                                name="guaranteedFundTopUp"
                                type="number"
                                value={guaranteedFundTopUp}
                                onChange={(e) => setGuaranteedFundTopUp(Number(e.target.value))}
                                required
                                disabled={isPending}
                            />
                        </div>

                        <div className="grid gap-1">
                            <Label htmlFor="app-monthly-payment">Monthly Principal Payment (₹)</Label>
                            <Input
                                id="app-monthly-payment"
                                name="monthlyPrincipalPayment"
                                type="number"
                                value={monthlyPrincipalPayment}
                                onChange={(e) => setMonthlyPrincipalPayment(Number(e.target.value))}
                                required
                                disabled={isPending}
                            />
                        </div>

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
                        </div>

                        <div className="p-3 bg-secondary/50 rounded-md border text-sm space-y-1.5 mt-2">
                            <p className="flex justify-between">
                                <span className="text-muted-foreground">Approved Principal:</span> 
                                <span className="font-semibold text-foreground">₹{approvedPrincipal.toLocaleString()}</span>
                            </p>
                            <p className="flex justify-between">
                                <span className="text-muted-foreground">Approved Tenure (calculated):</span> 
                                <span className="font-semibold text-foreground">{approvedTenure} months</span>
                            </p>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <input type="hidden" name="allowExceeding" value={allowExceeding ? "true" : "false"} />
                            <input
                                type="checkbox"
                                id="allow-exceeding-limit-approve"
                                checked={allowExceeding}
                                onChange={(e) => setAllowExceeding(e.target.checked)}
                                className="rounded border-input text-primary focus:ring-ring cursor-pointer"
                                disabled={isPending}
                             />
                             <Label htmlFor="allow-exceeding-limit-approve" className="text-sm font-medium cursor-pointer">
                                 Allow exceeding maximum loan limit
                             </Label>
                        </div>
                    </div>

                    <DialogFooter className="border-t pt-4">
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
