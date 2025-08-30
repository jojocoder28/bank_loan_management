
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
import { useTransition } from "react";

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

const ApprovalButton = ({ loanId, action, children, variant, onAction }: { loanId: string, action: (formData: FormData) => Promise<any>, children: React.ReactNode, variant: "default" | "destructive", onAction: (loanId: string) => void }) => {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleAction = (formData: FormData) => {
        startTransition(async () => {
            const result = await action(formData);
            if (result.error) {
                toast({ variant: 'destructive', title: 'Action Failed', description: result.error });
            } else {
                toast({ title: 'Success', description: `Loan has been ${variant === 'default' ? 'approved' : 'rejected'}.` });
                onAction(loanId);
            }
        });
    };

    return (
        <form action={handleAction}>
            <input type="hidden" name="loanId" value={loanId} />
            <Button size="sm" variant={variant} disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : children}
            </Button>
        </form>
    )
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
                        <TableCell>{new Date(loan.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="flex justify-end gap-2">
                            <ApprovalButton loanId={loan._id} action={approveLoan} variant="default" onAction={handleLoanAction}>
                                <Check className="mr-2 size-4" /> Approve
                            </ApprovalButton>
                            <ApprovalButton loanId={loan._id} action={rejectLoan} variant="destructive" onAction={handleLoanAction}>
                                <X className="mr-2 size-4" /> Reject
                            </ApprovalButton>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
