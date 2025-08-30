
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
import { approveModification, rejectModification, PopulatedModificationLoan } from "../actions";
import { Check, X, TrendingUp, HandCoins, Loader2 } from "lucide-react";
import Link from 'next/link';
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import React from "react";

const ModificationActionButton = ({ loanId, requestId, action, children, variant, onAction }: { loanId: string, requestId: string, action: (formData: FormData) => Promise<any>, children: React.ReactNode, variant: "default" | "destructive", onAction: (requestId: string) => void }) => {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleAction = (formData: FormData) => {
        startTransition(async () => {
            const result = await action(formData);
            if (result.error) {
                toast({ variant: 'destructive', title: 'Action Failed', description: result.error });
            } else {
                toast({ title: 'Success', description: `Modification request has been ${variant === 'default' ? 'approved' : 'rejected'}.` });
                onAction(requestId);
            }
        });
    };

    return (
        <form action={handleAction}>
            <input type="hidden" name="loanId" value={loanId} />
            <input type="hidden" name="requestId" value={requestId} />
            <Button size="sm" variant={variant} disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : children}
            </Button>
        </form>
    );
};


export function ModificationApprovals({ pendingModifications: initialModifications }: { pendingModifications: PopulatedModificationLoan[] }) {
    const [pendingModifications, setPendingModifications] = React.useState(initialModifications);
    
    const handleModificationAction = (requestId: string) => {
        setPendingModifications(currentModifications => 
            currentModifications.map(loan => ({
                ...loan,
                modificationRequests: loan.modificationRequests.filter(req => req._id !== requestId)
            })).filter(loan => loan.modificationRequests.length > 0)
        );
    };

    if (pendingModifications.length === 0) {
        return (
             <div className="text-center text-muted-foreground py-12">
                <p>There are no pending loan modification requests.</p>
            </div>
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Request Type</TableHead>
                    <TableHead>Current Value</TableHead>
                    <TableHead>Requested Value</TableHead>
                    <TableHead>Requested On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {pendingModifications.flatMap((loan) => 
                    loan.modificationRequests.map(request => (
                        <TableRow key={request._id}>
                            <TableCell className="font-medium">
                                <Link href={`/admin/users/${loan.user._id}`} className="text-primary hover:underline">
                                    {loan.user.name}
                                </Link>
                                <p className="text-xs text-muted-foreground">{loan.user.email}</p>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                {request.type === 'increase_amount' ? <TrendingUp className="size-4" /> : <HandCoins className="size-4" />}
                                <span className="capitalize">{request.type.replace('_', ' ')}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                {request.type === 'increase_amount' 
                                    ? `₹${loan.loanAmount.toLocaleString()}`
                                    : `₹${loan.monthlyPrincipalPayment.toLocaleString()}`
                                }
                            </TableCell>
                             <TableCell className="font-bold">₹{request.requestedValue.toLocaleString()}</TableCell>
                            <TableCell>{new Date(request.requestDate).toLocaleDateString()}</TableCell>
                            <TableCell className="flex justify-end gap-2">
                                <ModificationActionButton loanId={loan._id} requestId={request._id} action={approveModification} variant="default" onAction={handleModificationAction}>
                                    <Check className="mr-2 size-4" /> Approve
                                </ModificationActionButton>
                                <ModificationActionButton loanId={loan._id} requestId={request._id} action={rejectModification} variant="destructive" onAction={handleModificationAction}>
                                    <X className="mr-2 size-4" /> Reject
                                </ModificationActionButton>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    )
}
