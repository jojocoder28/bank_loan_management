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
import { Check, Loader2, X } from "lucide-react";
import Link from 'next/link';
import { approveProfileModification, rejectProfileModification, PopulatedProfileModification } from "../actions";
import { useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";

const ActionButton = ({ requestId, action, children, variant, onAction }: { requestId: string, action: (formData: FormData) => Promise<any>, children: React.ReactNode, variant: "default" | "destructive", onAction: (requestId: string, success: boolean, error?: string) => void }) => {
    const [isPending, startTransition] = useTransition();

    const handleAction = (formData: FormData) => {
        startTransition(async () => {
            const result = await action(formData);
            onAction(requestId, !!result.success, result.error);
        });
    };

    return (
        <form action={handleAction}>
            <input type="hidden" name="requestId" value={requestId} />
             <Button size="sm" variant={variant} disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : children}
            </Button>
        </form>
    );
};

export function ProfileApprovals({ pendingRequests: initialRequests }: { pendingRequests: PopulatedProfileModification[] }) {
    const { toast } = useToast();
    const [pendingRequests, setPendingRequests] = useState(initialRequests);
    
    const handleAction = (requestId: string, success: boolean, error?: string) => {
        if(error) {
            toast({
                variant: 'destructive',
                title: 'Action Failed',
                description: error
            })
        } else if (success) {
            toast({
                title: 'Success',
                description: 'Profile modification request processed.'
            });
            window.dispatchEvent(new CustomEvent('approvalCountChanged'));
            setPendingRequests(current => current.filter(r => r._id.toString() !== requestId));
        }
    }

    if (pendingRequests.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-12">
                <p>There are no pending profile modification requests to review.</p>
            </div>
        )
    }

    const formatKey = (key: string) => {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Requested Changes</TableHead>
                        <TableHead>Request Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pendingRequests.map((request) => (
                        <TableRow key={request._id.toString()}>
                            <TableCell className="font-medium align-top">
                                <Link href={`/admin/users/${request.user._id.toString()}`} className="text-primary hover:underline block">
                                    {request.user.name}
                                </Link>
                                <span className="text-xs text-muted-foreground">#{request.user.membershipNumber || 'N/A'}</span>
                            </TableCell>
                            <TableCell>
                                <ul className="list-disc pl-4 text-sm space-y-1">
                                    {Object.entries(request.requestedChanges).map(([key, value]) => (
                                        <li key={key}>
                                            <span className="font-semibold">{formatKey(key)}:</span> {String(value)}
                                        </li>
                                    ))}
                                </ul>
                            </TableCell>
                            <TableCell className="align-top whitespace-nowrap">{new Date(request.requestDate).toLocaleDateString()}</TableCell>
                            
                            <TableCell className="text-right align-top">
                                <div className="flex justify-end gap-2">
                                    <ActionButton requestId={request._id.toString()} action={approveProfileModification} variant="default" onAction={handleAction}>
                                        <Check className="mr-2 size-4" /> Approve
                                    </ActionButton>
                                    <ActionButton requestId={request._id.toString()} action={rejectProfileModification} variant="destructive" onAction={handleAction}>
                                        <X className="mr-2 size-4" /> Reject
                                    </ActionButton>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
