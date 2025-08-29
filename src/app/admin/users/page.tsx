
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getUsers } from "./actions";
import { UserRole, IUser } from "@/models/user";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { DeleteUserButton } from "./_components/delete-user-button";

export default async function UsersPage() {
  const users = await getUsers();

  const roleVariant: { [key in UserRole]: "default" | "secondary" | "outline" } = {
    admin: "default",
    board_member: "secondary",
    member: "secondary",
    user: "outline",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage all registered users and members.</CardDescription>
        </div>
        <Button asChild>
          <Link href="/admin/users/add">
            <UserPlus className="mr-2" />
            Add New Admin
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
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
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={roleVariant[user.role] || "outline"} className="capitalize">
                    {user.role.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>{user.membershipNumber || 'N/A'}</TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                    <DeleteUserButton userId={user._id.toString()} userName={user.name} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
