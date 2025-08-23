
"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { UserRole } from "@/models/user";
import { updateUserRole } from "../actions";
import { useToast } from "@/hooks/use-toast";

const initialState = {
  error: undefined,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} size="sm">
            {pending && <Loader2 className="mr-2 animate-spin" />}
            Save Role
        </Button>
    )
}

export function RoleManagement({ userId, currentRole }: { userId: string, currentRole: UserRole }) {
  const [state, formAction] = useActionState(updateUserRole, initialState);
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const { toast } = useToast();

  useEffect(() => {
    if (state.error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: state.error,
      });
    } else if (state.error === undefined) {
      // Don't show toast on initial render
    } else {
       toast({
        title: "Role Updated",
        description: "The user's role has been successfully changed.",
      });
    }
  }, [state, toast]);


  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="userId" value={userId} />
      <div className="grid gap-2">
        <Label htmlFor="role">User Role</Label>
        <div className="flex items-center gap-2">
             <Select name="role" value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                <SelectTrigger id="role" className="flex-1">
                    <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="board_member">Board Member</SelectItem>
                </SelectContent>
            </Select>
             <SubmitButton />
        </div>
      </div>
    </form>
  );
}
