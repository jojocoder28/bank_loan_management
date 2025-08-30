
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getUsers } from "./actions";
import { UserRole, IUser, UserStatus } from "@/models/user";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { DeactivateUserButton } from "./_components/deactivate-user-button";
import { UserTableFilters } from "./_components/user-table-filters";
import { RetireUserButton } from "./_components/retire-user-button";

export default async function UsersPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const status = searchParams?.status as UserStatus | undefined;
  const users = await getUsers(status);

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
      <CardHeader className="flex flex-row items-start justify-between">
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
            {users.map((user) => (
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
                        <RetireUserButton userId={user._id.toString()} userName={user.name} />
                    )}
                    {user.status === 'active' && user.role !== 'admin' && (
                        <DeactivateUserButton userId={user._id.toString()} userName={user.name} />
                    )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
