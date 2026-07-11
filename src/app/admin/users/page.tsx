
"use client";

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getUsers } from "./actions";
import { UserRole, IUser, UserStatus } from "@/models/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { UserPlus, Loader2, Edit, Search, Users } from "lucide-react";
import { DeactivateUserButton } from "./_components/deactivate-user-button";
import { UserTableFilters } from "./_components/user-table-filters";
import { RetireUserButton } from "./_components/retire-user-button";
import { ActivateUserButton } from "./_components/activate-user-button";
import { BulkEmailButton } from "./_components/bulk-email-button";
import { PasswordEmailActions } from "./_components/password-email-actions";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function UsersPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") as UserStatus | null;
  
  const [users, setUsers] = useState<IUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const fetchUsers = () => {
    startTransition(async () => {
      const fetchedUsers = await getUsers(status ?? undefined);
      setUsers(fetchedUsers);
    });
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (user.name?.toLowerCase().includes(query)) ||
      (user.phone?.toLowerCase().includes(query)) ||
      (user.email?.toLowerCase().includes(query)) ||
      (user.membershipNumber?.toLowerCase().includes(query))
    );
  });

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
    <Card className="border-primary/10 shadow-md">
      <CardHeader className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b pb-6">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Users className="size-5 text-primary" />
            User Management
          </CardTitle>
          <CardDescription>View and manage all registered users and members.</CardDescription>
        </div>
        <div className="flex items-center gap-2 md:gap-4 flex-wrap w-full md:w-auto">
            <UserTableFilters />
            <BulkEmailButton />
            <Button asChild variant="default" className="w-full sm:w-auto">
                <Link href="/admin/users/add-member" className="w-full justify-center">
                    <UserPlus className="mr-2 size-4" />
                    Add New Member
                </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/admin/users/add" className="w-full justify-center">
                    <UserPlus className="mr-2 size-4" />
                    Add New Admin
                </Link>
            </Button>
            <Button asChild variant="secondary" className="w-full sm:w-auto">
                <Link href="/admin/users/retired" className="w-full justify-center">
                    <UserPlus className="mr-2 size-4" />
                    Retired Members
                </Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Search Bar & Stats row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, email, or membership #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-full"
            />
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} registered users
          </div>
        </div>

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
                ) : filteredUsers.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground text-sm">
                      No matching users found.
                    </TableCell>
                </TableRow>
                ) : (
                    filteredUsers.map((user) => (
                    <TableRow key={(user as any)._id.toString()}>
                        <TableCell className="font-medium">
                        <Link href={`/admin/users/${(user as any)._id.toString()}`} className="text-primary hover:underline">
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
                        <TableCell suppressHydrationWarning>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                           <div className="flex justify-end items-center gap-1">
                               <TooltipProvider>
                                     <Tooltip>
                                         <TooltipTrigger asChild>
                                              <Button variant="ghost" size="icon" asChild>
                                                 <Link href={`/admin/users/${(user as any)._id.toString()}`}>
                                                     <Edit className="size-4" />
                                                 </Link>
                                             </Button>
                                         </TooltipTrigger>
                                         <TooltipContent><p>View/Edit Details</p></TooltipContent>
                                     </Tooltip>
                                     {user.role !== 'admin' && (
                                         <PasswordEmailActions 
                                             userId={(user as any)._id.toString()} 
                                             userEmail={user.email} 
                                             requiresPasswordChange={user.requiresPasswordChange ?? false}
                                         />
                                     )}
                                     {user.status === 'active' && user.role === 'member' && (
                                         <RetireUserButton userId={(user as any)._id.toString()} userName={user.name} onStatusChange={fetchUsers} />
                                     )}
                                     {user.status === 'active' && user.role !== 'admin' && (
                                         <DeactivateUserButton userId={(user as any)._id.toString()} userName={user.name} onStatusChange={fetchUsers} />
                                     )}
                                     {(user.status === 'inactive' || user.status === 'retired') && user.role !== 'admin' && (
                                         <ActivateUserButton userId={(user as any)._id.toString()} userName={user.name} onStatusChange={fetchUsers} />
                                     )}
                               </TooltipProvider>
                           </div>
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
