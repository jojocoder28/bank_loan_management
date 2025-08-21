
"use client";

import { useFormState, useFormStatus } from "react-dom";
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
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

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
  const [state, formAction] = useFormState(addUser, initialState);

  return (
    <form action={formAction}>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus />
            Add New User
          </CardTitle>
          <CardDescription>
            Create a new user account and assign them a role.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {state?.error?.form && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{state.error.form}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" placeholder="John Doe" required />
            {state?.error?.name && (
              <p className="text-sm text-destructive">{state.error.name[0]}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="user@example.com"
              required
            />
            {state?.error?.email && (
              <p className="text-sm text-destructive">{state.error.email[0]}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
            />
             {state?.error?.password && (
              <p className="text-sm text-destructive">{state.error.password[0]}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <Select name="role" defaultValue="member" required>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="board_member">Board Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
             {state?.error?.role && (
              <p className="text-sm text-destructive">{state.error.role[0]}</p>
            )}
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
