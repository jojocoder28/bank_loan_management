
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { UserX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SignupPage() {

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="mx-auto max-w-sm w-full text-center">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 justify-center">
            <UserX /> Sign Up Disabled
          </CardTitle>
          <CardDescription>
            New user registration is temporarily disabled.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
                We are not accepting new sign-ups at this time. Please check back later or contact an administrator if you believe this is an error.
            </p>
        </CardContent>
        <CardFooter>
            <Button asChild className="w-full">
                <Link href="/login">Back to Login</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
