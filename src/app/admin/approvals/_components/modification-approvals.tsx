
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const ModificationActionButton = ({ loanId, requestId, action, children, variant, onAction, tooltip }: { loanId: string, requestId: string, action: (formData: FormData) => Promise<any>, children: React.ReactNode, variant: "default" | "destructive", onAction: (requestId: string) => void, tooltip: string }) => {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleAction = (formData: FormData) => {
        startTransition(async () => {
            const result = await action(formData);
            if (result.error) {
                toast({ variant: 'destructive', title: 'Action Failed', description: result.error });
            } else {
                toast({ title: 'Success', description: `Modification request has been ${variant === 'default' ? 'approved' : 'rejected'}.` });
                window.dispatchEvent(new CustomEvent('approvalCountChanged'));
                onAction(requestId);
            }
        });
    };

    return (
        <form action={handleAction}>
            <input type="hidden" name="loanId" value={loanId} />
            <input type="hidden" name="requestId" value={requestId} />
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
        <div className="w-full overflow-x-auto">
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
                                    <div className="flex flex-col gap-1 items-start">
                                        <div className="flex items-center gap-2">
                                            {request.type === 'increase_amount' ? <TrendingUp className="size-4" /> : <HandCoins className="size-4" />}
                                            <span className="capitalize font-medium">{request.type.replace('_', ' ')}</span>
                                        </div>
                                        {request.type === 'change_payment' && (
                                            <span className={cn(
                                                "text-[10px] px-1.5 py-0.5 rounded-full border capitalize font-semibold",
                                                request.requestType === 'permanent'
                                                    ? "text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950/30 dark:border-purple-800"
                                                    : "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-800"
                                            )}>
                                                {request.requestType || 'temporary'}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {request.type === 'increase_amount' 
                                        ? `₹${loan.loanAmount.toLocaleString()}`
                                        : `₹${loan.monthlyPrincipalPayment.toLocaleString()}`
                                    }
                                </TableCell>
                                <TableCell className="font-bold">₹{request.requestedValue.toLocaleString()}</TableCell>
                                <TableCell suppressHydrationWarning>{new Date(request.requestDate).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <ModificationActionButton loanId={loan._id} requestId={request._id} action={approveModification} variant="default" onAction={handleModificationAction} tooltip="Approve Request">
                                            <Check className="size-4" />
                                        </ModificationActionButton>
                                        <ModificationActionButton loanId={loan._id} requestId={request._id} action={rejectModification} variant="destructive" onAction={handleModificationAction} tooltip="Reject Request">
                                            <X className="size-4" />
                                        </ModificationActionButton>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
