
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
import { Trash2 } from "lucide-react";
import { deleteUser } from "../actions";

export function DeleteUserButton({ userId, userName }: { userId: string, userName: string }) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
      const formData = new FormData();
      formData.append('userId', userId);
      await deleteUser(formData);
      setIsOpen(false);
      setIsConfirmed(false);
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the user{" "}
            <strong>{userName}</strong> and all of their associated data, including loans and payment history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`confirm-delete-${userId}`}
            checked={isConfirmed}
            onCheckedChange={(checked) => setIsConfirmed(checked as boolean)}
          />
          <Label htmlFor={`confirm-delete-${userId}`} className="text-sm font-normal">
            I understand this is permanent and wish to proceed.
          </Label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsConfirmed(false)}>Cancel</AlertDialogCancel>
          <form action={handleDelete}>
            <AlertDialogAction asChild>
                <Button type="submit" variant="destructive" disabled={!isConfirmed}>
                    Delete User
                </Button>
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
