
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getUsers } from "./actions";
import { UserRole, IUser, UserStatus } from "@/models/user";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserPlus, Loader2 } from "lucide-react";
import { DeactivateUserButton } from "./_components/deactivate-user-button";
import { UserTableFilters } from "./_components/user-table-filters";
import { RetireUserButton } from "./_components/retire-user-button";
import { ActivateUserButton } from "./_components/activate-user-button";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";

export default function UsersPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") as UserStatus | null;
  
  const [users, setUsers] = useState<IUser[]>([]);
  const [isPending, startTransition] = useTransition();

  const fetchUsers = () => {
    startTransition(async () => {
      const fetchedUsers = await getUsers(status ?? undefined);
      setUsers(fetchedUsers);
    });
  };

  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);


  const roleVariant: { [key in UserRole]: "default" | "secondary" | "outline" } = {
    admin: "default",
    board_member: "secondary",
    member: "secondary",
    user: "outline",
  };
  
  const statusVariant: { [key in UserStatus]: "default" | "destructive" | "secondary" } = {
      active: 'default',
      inactive: 'destructive',
      retired: 'secondary'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage all registered users and members.</CardDescription>
        </div>
        <div className="flex items-center gap-4">
            <UserTableFilters />
            <Button asChild>
                <Link href="/admin/users/add">
                    <UserPlus className="mr-2" />
                    Add New Admin
                </Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
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
              <TableHead className="text-right">Actions</TableHead>
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
                  No users found for this filter.
                </TableCell>
              </TableRow>
            ) : (
                users.map((user) => (
                  <TableRow key={user._id.toString()}>
                    <TableCell className="font-medium">
                       <Link href={`/admin/users/${user._id.toString()}`} className="text-primary hover:underline">
                          {user.name}
                        </Link>
                    </TableCell>
                    <TableCell>{user.phone || 'N/A'}</TableCell>
                    <TableCell>{user.email || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={roleVariant[user.role] || "outline"} className="capitalize">
                        {user.role.replace("_", " ")}
                      </Badge>
                    </TableCell>
                     <TableCell>
                        <Badge variant={statusVariant[user.status]} className="capitalize">
                            {user.status}
                        </Badge>
                    </TableCell>
                    <TableCell>{user.membershipNumber || 'N/A'}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right flex justify-end gap-1">
                        {user.status === 'active' && user.role === 'member' && (
                            <RetireUserButton userId={user._id.toString()} userName={user.name} onStatusChange={fetchUsers} />
                        )}
                        {user.status === 'active' && user.role !== 'admin' && (
                            <DeactivateUserButton userId={user._id.toString()} userName={user.name} onStatusChange={fetchUsers} />
                        )}
                        {(user.status === 'inactive' || user.status === 'retired') && user.role !== 'admin' && (
                            <ActivateUserButton userId={user._id.toString()} userName={user.name} onStatusChange={fetchUsers} />
                        )}
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
