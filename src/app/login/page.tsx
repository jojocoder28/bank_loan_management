
"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LogIn, AlertTriangle, MailCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { login } from "./actions";
import { resendVerificationEmail } from "./reverify-actions";
import { useToast } from "@/hooks/use-toast";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showReverify, setShowReverify] = useState(false);
  const [reverifyEmail, setReverifyEmail] = useState("");

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleReverify = async () => {
      startTransition(async () => {
          const result = await resendVerificationEmail(reverifyEmail);
          if (result.error) {
              toast({
                  variant: 'destructive',
                  title: 'Failed to Resend',
                  description: result.error,
              })
          } else {
               toast({
                  title: 'Email Sent!',
                  description: 'A new verification link has been sent to your email address.',
              })
              setShowReverify(false);
          }
      })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowReverify(false);
    
    startTransition(async () => {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      
      const result = await login(formData);

      if (result.error) {
        setError(result.error);
        if (result.isUnverified) {
            setShowReverify(true);
            setReverifyEmail(email);
        }
      } else if (result.role) {
        // Handle redirection on the client side
        const dashboardPath = result.role === 'admin' ? '/admin/dashboard' : '/dashboard';
        router.push(dashboardPath);
        // We call router.refresh() to ensure the new session is picked up by the layout
        router.refresh();
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <LogIn/> Login
          </CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
             <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Login Failed</AlertTitle>
                <AlertDescription>
                    {error}
                </AlertDescription>
                {showReverify && (
                    <Button 
                        variant="link" 
                        className="p-0 h-auto text-destructive-foreground font-bold mt-2"
                        onClick={handleReverify}
                        disabled={isPending}
                        >
                        <MailCheck className="mr-2" />
                        {isPending ? 'Sending...' : 'Resend Verification Email'}
                    </Button>
                )}
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Logging in..." : "Login"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
