"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2 } from "lucide-react";
import { sendBulkOnboardingEmails } from "../actions";

export function BulkEmailButton() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleBulkSend = () => {
    startTransition(async () => {
      try {
        const res = await sendBulkOnboardingEmails();
        if (res.error) {
          toast({
            variant: "destructive",
            title: "Bulk Invites Failed",
            description: res.error
          });
        } else if (res.success) {
          toast({
            title: "Bulk Emails Processed",
            description: res.success
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
    <Button 
      variant="outline" 
      onClick={handleBulkSend} 
      disabled={isPending}
      className="w-full sm:w-auto border-primary/20 hover:bg-primary/5 text-foreground"
    >
      {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Mail className="mr-2 size-4" />}
      Bulk Send Welcome Emails
    </Button>
  );
}
