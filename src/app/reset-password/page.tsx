"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useTransition, Suspense } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Landmark, Loader2, KeyRound, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { resetPasswordWithToken } from "./actions";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const token = searchParams.get("token") || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!token) {
            setError("Password reset token is missing or invalid. Please check your email link.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        startTransition(async () => {
            const result = await resetPasswordWithToken(token, password);
            if (result.error) {
                setError(result.error);
            } else {
                toast({
                    title: "Password Updated",
                    description: "Your password has been successfully reset. Please log in with your new password.",
                });
                router.push("/login");
            }
        });
    };

    return (
        <Card className="w-full max-w-md shadow-lg border border-border/40 bg-card">
            <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center mb-3">
                    <div className="p-3 bg-primary/10 rounded-full text-primary">
                        <KeyRound className="size-6" />
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Reset Password</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">
                    Enter your new password below to secure your account.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4 pt-2">
                    {error && (
                        <Alert variant="destructive" className="py-2.5">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle className="text-xs font-semibold">Error</AlertTitle>
                            <AlertDescription className="text-xs">{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={isPending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={isPending}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pb-6 pt-2">
                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                        Update Password
                    </Button>
                    <div className="text-center text-xs text-muted-foreground mt-2">
                        Remember your password?{" "}
                        <Link href="/login" className="text-primary hover:underline font-semibold">
                            Back to Login
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen w-full flex flex-col justify-between bg-muted/30">
            {/* Header */}
            <header className="px-6 py-4 border-b border-border/20 bg-background/50 backdrop-blur-md sticky top-0 flex items-center justify-between z-10">
                <Link href="/" className="flex items-center gap-2">
                    <Landmark className="h-6 w-6 text-primary" />
                    <span className="font-bold text-lg tracking-tight text-foreground">S&KGPPS Co-op</span>
                </Link>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex items-center justify-center p-6">
                <Suspense fallback={
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="size-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading password reset form...</p>
                    </div>
                }>
                    <ResetPasswordForm />
                </Suspense>
            </main>

            {/* Footer */}
            <footer className="border-t border-border/20 py-4 px-6 bg-background/40 backdrop-blur-sm text-center text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} Sarisha & Khorda G P Primary School Teachers Co Operative Credit Society LTD. All rights reserved.
            </footer>
        </div>
    );
}
