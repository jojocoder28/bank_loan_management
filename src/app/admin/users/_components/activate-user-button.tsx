
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
import { activateUser } from "../actions";

export function ActivateUserButton({ userId, userName }: { userId: string, userName: string }) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleActivate = async () => {
      const formData = new FormData();
      formData.append('userId', userId);
      await activateUser(formData);
      setIsOpen(false);
      setIsConfirmed(false);
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-green-500 hover:text-green-600">
          <UserCheck className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reactivate User?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will mark the user <strong>{userName}</strong> as active. They will regain the ability to log in and perform actions as an active member.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`confirm-activate-${userId}`}
            checked={isConfirmed}
            onCheckedChange={(checked) => setIsConfirmed(checked as boolean)}
          />
          <Label htmlFor={`confirm-activate-${userId}`} className="text-sm font-normal">
            I understand and wish to reactivate this user.
          </Label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsConfirmed(false)}>Cancel</AlertDialogCancel>
          <form action={handleActivate}>
            <AlertDialogAction asChild>
                <Button type="submit" variant="default" disabled={!isConfirmed} className="bg-green-600 hover:bg-green-700">
                    Reactivate User
                </Button>
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
