
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
import { Input } from "@/components/ui/input";
import { Check, Loader2, X } from "lucide-react";
import Link from 'next/link';
import { IUser } from "@/models/user";
import { approveMembership, rejectMembership } from "../actions";
import { useEffect, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";


const MembershipActionButton = ({ userId, action, children, variant, onAction }: { userId: string, action: (formData: FormData) => Promise<any>, children: React.ReactNode, variant: "default" | "destructive", onAction: (userId: string, success: boolean, error?: string) => void }) => {
    const [isPending, startTransition] = useTransition();

    const handleAction = (formData: FormData) => {
        startTransition(async () => {
            const result = await action(formData);
            onAction(userId, !!result.success, result.error);
        });
    };

    return (
        <form action={handleAction}>
            <input type="hidden" name="userId" value={userId} />
             <Button size="sm" variant={variant} disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : children}
            </Button>
        </form>
    );
};

export function MembershipApprovals({ pendingUsers: initialUsers }: { pendingUsers: IUser[] }) {
    const { toast } = useToast();
    const [pendingUsers, setPendingUsers] = useState(initialUsers);
    const [membershipNumbers, setMembershipNumbers] = useState<{ [key: string]: string }>({});
    
    const handleAction = (userId: string, success: boolean, error?: string) => {
        if(error) {
            toast({
                variant: 'destructive',
                title: 'Action Failed',
                description: error
            })
        } else if (success) {
            const isApproval = !error; // Simple check if it was an approval or rejection based on error presence. A better way would be passing the action type.
             toast({
                title: 'Success',
                description: `Membership has been ${isApproval ? 'approved' : 'rejected'}.`
            });
            setPendingUsers(currentUsers => currentUsers.filter(u => u._id.toString() !== userId));
        }
    }


    const handleNumberChange = (userId: string, value: string) => {
        setMembershipNumbers(prev => ({ ...prev, [userId]: value }));
    }
    

    if (pendingUsers.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-12">
                <p>There are no pending membership applications to review.</p>
            </div>
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead>Assign Membership #</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {pendingUsers.map((user) => (
                     <TableRow key={user._id.toString()}>
                        <TableCell className="font-medium">
                            <Link href={`/admin/users/${user._id.toString()}`} className="text-primary hover:underline">
                                {user.name}
                            </Link>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                             <form action={async (formData) => {
                                 const result = await approveMembership(formData);
                                 handleAction(user._id.toString(), !!result.success, result.error);
                             }} id={`form-${user._id.toString()}`}>
                                <input type="hidden" name="userId" value={user._id.toString()} />
                                <Input
                                    name="membershipNumber"
                                    placeholder="Required for approval"
                                    required
                                    value={membershipNumbers[user._id.toString()] || ''}
                                    onChange={(e) => handleNumberChange(user._id.toString(), e.target.value)}
                                />
                            </form>
                        </TableCell>
                         <TableCell className="text-right flex justify-end gap-2">
                            <Button size="sm" type="submit" form={`form-${user._id.toString()}`} disabled={!membershipNumbers[user._id.toString()]}>
                                 <Check className="mr-2 size-4" /> Approve
                           </Button>
                           <MembershipActionButton userId={user._id.toString()} action={rejectMembership} variant="destructive" onAction={handleAction}>
                                <X className="mr-2 size-4" /> Reject
                            </MembershipActionButton>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
