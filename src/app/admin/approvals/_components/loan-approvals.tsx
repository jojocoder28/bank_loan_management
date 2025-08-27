
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
import { Check, X } from "lucide-react";
import Link from 'next/link';
import { ILoan } from "@/models/loan";
import { IUser } from "@/models/user";

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

const ApprovalForm = ({ loanId, action, children, variant }: { loanId: string, action: (formData: FormData) => void, children: React.ReactNode, variant: "default" | "destructive" }) => (
    <form action={action}>
        <input type="hidden" name="loanId" value={loanId} />
        <Button size="sm" variant={variant}>
            {children}
        </Button>
    </form>
)

export function LoanApprovals({ pendingLoans }: { pendingLoans: PopulatedLoan[] }) {

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
                            <ApprovalForm loanId={loan._id} action={approveLoan} variant="default">
                                <Check className="mr-2 size-4" /> Approve
                            </ApprovalForm>
                            <ApprovalForm loanId={loan._id} action={rejectLoan} variant="destructive">
                                <X className="mr-2 size-4" /> Reject
                            </ApprovalForm>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
