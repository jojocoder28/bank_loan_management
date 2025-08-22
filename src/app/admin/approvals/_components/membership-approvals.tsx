
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
import { Check } from "lucide-react";
import Link from 'next/link';
import { IUser } from "@/models/user";
import { approveMembership } from "../actions";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/hooks/use-toast";


const initialState = {
    error: null
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button size="sm" type="submit" disabled={pending}>
            <Check className="mr-2 size-4" /> {pending ? "Approving..." : "Approve"}
        </Button>
    )
}

export function MembershipApprovals({ pendingMemberships }: { pendingMemberships: IUser[] }) {
    const [state, formAction] = useActionState(approveMembership, initialState);
    const { toast } = useToast();
    const [membershipNumbers, setMembershipNumbers] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (state?.error) {
            toast({
                variant: 'destructive',
                title: 'Approval Failed',
                description: state.error
            })
        }
    }, [state, toast])

    const handleNumberChange = (userId: string, value: string) => {
        setMembershipNumbers(prev => ({ ...prev, [userId]: value }));
    }

    if (pendingMemberships.length === 0) {
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
                    <TableHead>Share Fund</TableHead>
                    <TableHead>Assign Membership #</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {pendingMemberships.map((user) => (
                    <TableRow key={user._id.toString()}>
                        <TableCell className="font-medium">
                            <Link href={`/admin/users/${user._id.toString()}`} className="text-primary hover:underline">
                                {user.name}
                            </Link>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>₹{user.shareFund?.toLocaleString()}</TableCell>
                        <TableCell>
                            <form action={formAction} id={`form-${user._id.toString()}`}>
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
                           <SubmitButton />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

