
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addUser } from "./actions";
import { AlertTriangle, Loader2, UserPlus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const initialState = {
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 animate-spin" />
          Creating User...
        </>
      ) : (
        "Create User"
      )}
    </Button>
  );
}

export default function AddUserPage() {
  const [state, formAction] = useActionState(addUser, initialState as any);

  return (
    <form action={formAction}>
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus />
            Add New User
          </CardTitle>
          <CardDescription>
            Create a new user account and assign them a role. All fields are optional except core credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {state?.error?.form && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{state.error.form}</AlertDescription>
            </Alert>
          )}

          {/* Section: Core Credentials */}
          <div className="space-y-4">
             <p className="text-sm font-medium text-muted-foreground">Core Credentials & Status</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" placeholder="John Doe" required />
                    {state?.error?.name && <p className="text-sm text-destructive">{state.error.name[0]}</p>}
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" name="email" type="email" placeholder="user@example.com" required />
                    {state?.error?.email && <p className="text-sm text-destructive">{state.error.email[0]}</p>}
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required minLength={6} />
                    {state?.error?.password && <p className="text-sm text-destructive">{state.error.password[0]}</p>}
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Select name="role" defaultValue="member" required>
                        <SelectTrigger id="role"><SelectValue placeholder="Select a role" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="board_member">Board Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                    {state?.error?.role && <p className="text-sm text-destructive">{state.error.role[0]}</p>}
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="membershipStatus">Membership Status</Label>
                    <Select name="membershipStatus" defaultValue="provisional" required>
                        <SelectTrigger id="membershipStatus"><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="provisional">Provisional</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </div>
          
          <Separator />

          {/* Section: Personal Information */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Personal Information</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="personalAddress">Personal Address</Label>
                    <Input id="personalAddress" name="personalAddress" placeholder="123 Main St, Anytown" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" placeholder="+1 234 567 890" />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="grid gap-2">
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" name="age" type="number" placeholder="30" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="gender">Gender</Label>
                     <Select name="gender">
                        <SelectTrigger id="gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="membershipNumber">Membership Number</Label>
                    <Input id="membershipNumber" name="membershipNumber" placeholder="MEM12345" />
                    {state?.error?.membershipNumber && <p className="text-sm text-destructive">{state.error.membershipNumber[0]}</p>}
                </div>
             </div>
          </div>

          <Separator />
          
          {/* Section: Professional Details */}
          <div className="space-y-4">
             <p className="text-sm font-medium text-muted-foreground">Professional Details</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="workplace">Workplace</Label>
                    <Input id="workplace" name="workplace" placeholder="ABC Corporation" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="profession">Profession / Position</Label>
                    <Input id="profession" name="profession" placeholder="Software Engineer" />
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="workplaceAddress">Workplace Address</Label>
                <Input id="workplaceAddress" name="workplaceAddress" placeholder="456 Work Ave, Business City" />
            </div>
          </div>

          <Separator />

          {/* Section: Financial Details */}
           <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground">Financial & Nominee Details</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="shareFund">Share Fund (Rs.)</Label>
                        <Input id="shareFund" name="shareFund" type="number" placeholder="5000" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="guaranteedFund">Guaranteed Fund (Rs.)</Label>
                        <Input id="guaranteedFund" name="guaranteedFund" type="number" placeholder="5000" />
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                    <Input id="bankAccountNumber" name="bankAccountNumber" placeholder="9876543210" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="nomineeName">Nominee Name</Label>
                        <Input id="nomineeName" name="nomineeName" placeholder="Jane Doe" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="nomineeRelation">Nominee Relation</Label>
                        <Input id="nomineeRelation" name="nomineeRelation" placeholder="Spouse" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="nomineeAge">Nominee Age</Label>
                        <Input id="nomineeAge" name="nomineeAge" type="number" placeholder="28" />
                    </div>
                </div>
            </div>

        </CardContent>
        <CardFooter className="flex justify-end gap-2">
            <Button variant="ghost" asChild>
                <Link href="/admin/users">Cancel</Link>
            </Button>
            <SubmitButton />
        </CardFooter>
      </Card>
    </form>
  );
}
