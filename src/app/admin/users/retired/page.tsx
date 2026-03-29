"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getUsers } from "../actions";
import { UserRole, IUser } from "@/models/user";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { useState, useEffect, useTransition } from "react";

export default function RetiredUsersPage() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const fetchedUsers = await getUsers('retired');
      setUsers(fetchedUsers);
    });
  }, []);

  const roleVariant: { [key in UserRole]: "default" | "secondary" | "outline" } = {
    admin: "default",
    board_member: "secondary",
    member: "secondary",
    user: "outline",
  };

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-destructive">Retired Members</CardTitle>
          <CardDescription>View all members who have retired or whose memberships have expired.</CardDescription>
        </div>
        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            <Button asChild variant="outline">
                <Link href="/admin/users">
                    <ArrowLeft className="mr-2 size-4" />
                    Back to Active Users
                </Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Membership #</TableHead>
                <TableHead>Registered On</TableHead>
                <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isPending ? (
                <TableRow>
                    <TableCell colSpan={8} className="text-center">
                    <div className="flex justify-center items-center py-8">
                        <Loader2 className="size-8 animate-spin text-muted-foreground" />
                    </div>
                    </TableCell>
                </TableRow>
                ) : users.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={8} className="text-center h-24">
                    There are no retired members in the system.
                    </TableCell>
                </TableRow>
                ) : (
                    users.map((user) => (
                    <TableRow key={(user as any)._id.toString()}>
                        <TableCell className="font-medium text-muted-foreground">
                        <Link href={`/admin/users/${(user as any)._id.toString()}`} className="hover:underline">
                            {user.name}
                            </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.phone || 'N/A'}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email || 'N/A'}</TableCell>
                        <TableCell>
                        <Badge variant={roleVariant[user.role] || "outline"} className="capitalize bg-muted text-muted-foreground">
                            {user.role.replace("_", " ")}
                        </Badge>
                        </TableCell>
                        <TableCell>
                            <Badge variant="secondary" className="capitalize">
                                {user.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.membershipNumber || 'N/A'}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                           <Button asChild variant="outline" size="sm">
                               <Link href={`/admin/users/${(user as any)._id.toString()}`}>
                                    View Details
                               </Link>
                           </Button>
                        </TableCell>
                    </TableRow>
                    ))
                )}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
