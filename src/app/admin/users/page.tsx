
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getUsers } from "./actions";
import { UserRole } from "@/models/user";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserPlus } from "lucide-react";

export default async function UsersPage() {
  const users = await getUsers();

  const roleVariant: { [key in UserRole]: "default" | "secondary" | "outline" } = {
    admin: "default",
    board_member: "secondary",
    member: "outline",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage all registered users.</CardDescription>
        </div>
        <Button asChild>
          <Link href="/admin/users/add">
            <UserPlus className="mr-2" />
            Add New User
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
              <TableHead>Member Since</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id.toString()}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={roleVariant[user.role] || "outline"}>
                    {user.role.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
