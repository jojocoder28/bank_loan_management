
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
import { Check, Loader2 } from "lucide-react";
import Link from 'next/link';
import { IUser } from "@/models/user";
import { approveMembership } from "../actions";
import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/hooks/use-toast";


const initialState = {
    error: null,
    success: false,
}

function SubmitButton({ userId, isInputFilled }: { userId: string, isInputFilled: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button size="sm" type="submit" form={`form-${userId}`} disabled={pending || !isInputFilled}>
            {pending ? <><Loader2 className="mr-2 size-4 animate-spin"/> Approving...</> : <><Check className="mr-2 size-4" /> Approve</>}
        </Button>
    )
}

export function MembershipApprovals({ pendingUsers: initialUsers }: { pendingUsers: IUser[] }) {
    const [state, formAction] = useActionState(approveMembership, initialState);
    const { toast } = useToast();
    const [pendingUsers, setPendingUsers] = useState(initialUsers);
    const [membershipNumbers, setMembershipNumbers] = useState<{ [key: string]: string }>({});
    const [lastApprovedId, setLastApprovedId] = useState<string | null>(null);

    useEffect(() => {
        if (state?.error) {
            toast({
                variant: 'destructive',
                title: 'Approval Failed',
                description: state.error
            })
        }
         if (state?.success && lastApprovedId) {
            toast({
                title: 'Success',
                description: "Membership has been approved."
            });
            // Optimistically remove user from the list
            setPendingUsers(currentUsers => currentUsers.filter(u => u._id.toString() !== lastApprovedId));
            setLastApprovedId(null);
        }
    }, [state, toast, lastApprovedId])

    const handleNumberChange = (userId: string, value: string) => {
        setMembershipNumbers(prev => ({ ...prev, [userId]: value }));
    }
    
    const handleFormAction = (formData: FormData) => {
        const userId = formData.get('userId') as string;
        setLastApprovedId(userId);
        formAction(formData);
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
                             <form action={handleFormAction} id={`form-${user._id.toString()}`}>
                                <input type="hidden" name="userId" value={user._id.toString()} />
                                <Input
                                    name="membershipNumber"
                                    placeholder="e.g. MEM123"
                                    required
                                    value={membershipNumbers[user._id.toString()] || ''}
                                    onChange={(e) => handleNumberChange(user._id.toString(), e.target.value)}
                                />
                            </form>
                        </TableCell>
                         <TableCell className="text-right">
                           <SubmitButton userId={user._id.toString()} isInputFilled={!!membershipNumbers[user._id.toString()]} />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
