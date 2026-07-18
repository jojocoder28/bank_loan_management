"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";
import { sendPasswordResetEmail } from "../../actions";
import { useToast } from "@/hooks/use-toast";

interface SendResetPasswordButtonProps {
    userId: string;
    userEmail?: string | null;
}

export function SendResetPasswordButton({ userId, userEmail }: SendResetPasswordButtonProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleSend = () => {
        if (!userEmail) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "This member does not have a registered email address."
            });
            return;
        }

        startTransition(async () => {
            const result = await sendPasswordResetEmail(userId);
            if (result.error) {
                toast({
                    variant: "destructive",
                    title: "Failed to Send",
                    description: result.error
                });
            } else {
                toast({
                    title: "Email Sent",
                    description: `Password reset link has been successfully sent to ${userEmail}.`
                });
            }
        });
    };

    return (
        <Button 
            onClick={handleSend} 
            disabled={isPending || !userEmail} 
            variant="outline" 
            className="w-full justify-start gap-2 text-foreground"
        >
            {isPending ? (
                <Loader2 className="size-4 animate-spin" />
            ) : (
                <Mail className="size-4 text-muted-foreground" />
            )}
            Send Password Reset Link
        </Button>
    );
}
