
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
import { UserX } from "lucide-react";
import { deactivateUser } from "../actions";

export function DeactivateUserButton({ userId, userName }: { userId: string, userName: string }) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDeactivate = async () => {
      const formData = new FormData();
      formData.append('userId', userId);
      await deactivateUser(formData);
      setIsOpen(false);
      setIsConfirmed(false);
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
          <UserX className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will mark the user <strong>{userName}</strong> as inactive. They will no longer be able to log in or perform actions as an active member. Their data will be preserved for historical records.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`confirm-deactivate-${userId}`}
            checked={isConfirmed}
            onCheckedChange={(checked) => setIsConfirmed(checked as boolean)}
          />
          <Label htmlFor={`confirm-deactivate-${userId}`} className="text-sm font-normal">
            I understand and wish to deactivate this user.
          </Label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsConfirmed(false)}>Cancel</AlertDialogCancel>
          <form action={handleDeactivate}>
            <AlertDialogAction asChild>
                <Button type="submit" variant="destructive" disabled={!isConfirmed}>
                    Deactivate User
                </Button>
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
