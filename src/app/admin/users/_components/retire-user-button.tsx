
"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { UserCheck } from "lucide-react";
import { retireUser } from "../actions";
import { useToast } from "@/hooks/use-toast";

export function RetireUserButton({ userId, userName }: { userId: string, userName: string }) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
   const { toast } = useToast();

  const handleRetire = async () => {
      const formData = new FormData();
      formData.append('userId', userId);
      const result = await retireUser(formData);
      
      if (result?.error) {
        toast({
            variant: "destructive",
            title: "Action Failed",
            description: result.error,
        });
      } else {
         toast({
            title: "Success",
            description: `User ${userName} has been marked as retired.`,
        });
      }

      setIsOpen(false);
      setIsConfirmed(false);
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-600">
          <UserCheck className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Retire Member?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will mark the member <strong>{userName}</strong> as retired. They will retain access but may have different privileges. Their data will be preserved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`confirm-retire-${userId}`}
            checked={isConfirmed}
            onCheckedChange={(checked) => setIsConfirmed(checked as boolean)}
          />
          <Label htmlFor={`confirm-retire-${userId}`} className="text-sm font-normal">
            I understand and wish to mark this member as retired.
          </Label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsConfirmed(false)}>Cancel</AlertDialogCancel>
          <form action={handleRetire}>
            <AlertDialogAction asChild>
                <Button type="submit" variant="default" disabled={!isConfirmed}>
                    Retire Member
                </Button>
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
