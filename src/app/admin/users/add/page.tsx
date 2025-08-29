
"use client";

import { useActionState, useState } from "react";
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
import { addUser } from "./actions";
import { AlertTriangle, Loader2, UserPlus, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

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
          Creating Admin...
        </>
      ) : (
        "Create Admin"
      )}
    </Button>
  );
}

export default function AddUserPage() {
  const [state, formAction] = useActionState(addUser, initialState as any);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <form action={formAction}>
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus />
            Add New Administrator
          </CardTitle>
          <CardDescription>
            Create a new administrator account with full system privileges.
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

          <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" placeholder="John Doe" required />
              {state?.error?.name && <p className="text-sm text-destructive">{state.error.name[0]}</p>}
          </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" type="tel" placeholder="e.g. 9876543210" required />
              {state?.error?.phone && <p className="text-sm text-destructive">{state.error.phone[0]}</p>}
          </div>
           <div className="grid gap-2">
              <Label htmlFor="email">Email Address (Optional)</Label>
              <Input id="email" name="email" type="email" placeholder="admin@example.com" />
              {state?.error?.email && <p className="text-sm text-destructive">{state.error.email[0]}</p>}
          </div>
          <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" name="password" type={showPassword ? "text" : "password"} required minLength={6} />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                    >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </Button>
              </div>
              {state?.error?.password && <p className="text-sm text-destructive">{state.error.password[0]}</p>}
          </div>
          <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
               <div className="relative">
                <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} required minLength={6} />
                 <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                </Button>
              </div>
              {state?.error?.confirmPassword && <p className="text-sm text-destructive">{state.error.confirmPassword[0]}</p>}
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
