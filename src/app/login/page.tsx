
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
import { LogIn, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { login } from "./actions";


export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    startTransition(async () => {
      const formData = new FormData();
      formData.append('identifier', identifier);
      formData.append('password', password);
      
      const result = await login(formData);

      if (result.error) {
        setError(result.error);
      } else {
        if (result.requiresPasswordChange) {
            router.push('/force-password-change');
        } else if (result.role === 'admin') {
            router.push('/admin/dashboard');
        } else {
            router.push('/dashboard');
        }
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
            Enter your email or phone number below to login to your account
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
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="identifier">Email or Phone Number</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="email@example.com or 9876543210"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isPending}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Logging in..." : "Login"}
            </Button>
          </form>
          {/* <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
}
