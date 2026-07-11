"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Key, Mail, RefreshCw, Loader2 } from "lucide-react";
import { sendOnboardingEmail, resetUserPasswordAndEmail } from "../actions";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PasswordEmailActionsProps {
  userId: string;
  userEmail?: string | null;
  requiresPasswordChange: boolean;
}

export function PasswordEmailActions({ userId, userEmail, requiresPasswordChange }: PasswordEmailActionsProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleSendOnboarding = () => {
    if (!userEmail) {
      toast({
        variant: "destructive",
        title: "No Email Provided",
        description: "Cannot send onboarding invite without an email address."
      });
      return;
    }

    startTransition(async () => {
      try {
        const res = await sendOnboardingEmail(userId);
        if (res.error) {
          toast({
            variant: "destructive",
            title: "Failed to Send Email",
            description: res.error
          });
        } else if (res.success) {
          toast({
            title: "Email Sent",
            description: `Onboarding credentials sent successfully to ${userEmail}.`
          });
        }
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: err.message || "An unexpected error occurred."
        });
      }
    });
  };

  const handleResetPassword = () => {
    if (!userEmail) {
      toast({
        variant: "destructive",
        title: "No Email Provided",
        description: "Cannot reset and email credentials without an email address."
      });
      return;
    }

    startTransition(async () => {
      try {
        const res = await resetUserPasswordAndEmail(userId);
        if (res.error) {
          toast({
            variant: "destructive",
            title: "Reset Failed",
            description: res.error
          });
        } else if (res.success) {
          toast({
            title: "Password Reset & Emailed",
            description: `A new temporary password has been successfully emailed to ${userEmail}.`
          });
        }
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: err.message || "An unexpected error occurred."
        });
      }
    });
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Key className="size-4" />}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Password & Emails</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Password & Emails</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSendOnboarding} disabled={!userEmail || isPending}>
          <Mail className="mr-2 size-4 text-primary" />
          <span>Send Welcome Credentials</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleResetPassword} disabled={!userEmail || isPending}>
          <RefreshCw className="mr-2 size-4 text-destructive" />
          <span>Reset & Email Password</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
