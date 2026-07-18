"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateUserDetails } from "../actions";
import { Edit2, Loader2, User, Landmark, Users2, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const initialState = {
  error: null,
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto shadow-md">
      {pending ? (
        <>
          <Loader2 className="mr-2 animate-spin size-4" />
          Saving Changes...
        </>
      ) : (
        "Save Changes"
      )}
    </Button>
  );
}

export function EditUserDetailsDialog({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();

  const handleAction = async (prevState: any, formData: FormData) => {
    const res = await updateUserDetails(prevState, formData);
    if (res.success) {
      toast({
        title: "Success",
        description: "User details updated successfully.",
      });
      setOpen(false);
    }
    return res;
  };

  const [state, formAction] = useActionState(handleAction, initialState as any);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 shadow-sm">
          <Edit2 className="size-4" />
          Edit Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Member Details</DialogTitle>
          <DialogDescription>
            Update personal, professional, nominee, and general account information.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} noValidate>
          <input type="hidden" name="userId" value={user._id} />

          {state?.error?.form && (
            <Alert variant="destructive" className="mb-4">
              <ShieldAlert className="size-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{state.error.form[0]}</AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto gap-1 bg-muted p-1 mb-6">
              <TabsTrigger value="general" className="py-2 justify-center gap-2">
                <User className="size-4" />
                <span>General</span>
              </TabsTrigger>
              <TabsTrigger value="personal" className="py-2 justify-center gap-2">
                <Landmark className="size-4" />
                <span>Personal</span>
              </TabsTrigger>
              <TabsTrigger value="nominee" className="py-2 justify-center gap-2">
                <Users2 className="size-4" />
                <span>Nominee & Work</span>
              </TabsTrigger>
            </TabsList>

            {/* GENERAL DETAILS */}
            <TabsContent value="general" forceMount className="space-y-4 data-[state=inactive]:hidden">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Full Name *</Label>
                  <Input id="edit-name" name="name" defaultValue={user.name} required />
                  {state?.error?.name && <p className="text-xs text-destructive">{state.error.name[0]}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Phone Number *</Label>
                  <Input id="edit-phone" name="phone" type="tel" defaultValue={user.phone} required />
                  {state?.error?.phone && <p className="text-xs text-destructive">{state.error.phone[0]}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email Address</Label>
                  <Input id="edit-email" name="email" type="email" defaultValue={user.email || ""} />
                  {state?.error?.email && <p className="text-xs text-destructive">{state.error.email[0]}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-membershipNumber">Membership #</Label>
                  <Input id="edit-membershipNumber" name="membershipNumber" defaultValue={user.membershipNumber || ""} />
                  {state?.error?.membershipNumber && <p className="text-xs text-destructive">{state.error.membershipNumber[0]}</p>}
                </div>
              </div>
            </TabsContent>

            {/* PERSONAL DETAILS */}
            <TabsContent value="personal" forceMount className="space-y-4 data-[state=inactive]:hidden">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-bankAccountNumber">Bank Account Number</Label>
                  <Input id="edit-bankAccountNumber" name="bankAccountNumber" defaultValue={user.bankAccountNumber || ""} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-dob">Date of Birth</Label>
                  <Input id="edit-dob" name="dob" type="date" defaultValue={user.dob ? new Date(user.dob).toISOString().split('T')[0] : ""} />
                  {state?.error?.dob && <p className="text-xs text-destructive">{state.error.dob[0]}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-gender">Gender</Label>
                  <select 
                    id="edit-gender" 
                    name="gender" 
                    defaultValue={user.gender || ""}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {state?.error?.gender && <p className="text-xs text-destructive">{state.error.gender[0]}</p>}
                </div>

                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="edit-personalAddress">Personal Address</Label>
                  <Input id="edit-personalAddress" name="personalAddress" defaultValue={user.personalAddress || ""} />
                </div>
              </div>
            </TabsContent>

            {/* NOMINEE & WORK */}
            <TabsContent value="nominee" forceMount className="space-y-4 data-[state=inactive]:hidden">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-profession">Profession</Label>
                  <Input id="edit-profession" name="profession" defaultValue={user.profession || ""} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-workplace">Workplace</Label>
                  <Input id="edit-workplace" name="workplace" defaultValue={user.workplace || ""} />
                </div>

                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="edit-workplaceAddress">Workplace Address</Label>
                  <Input id="edit-workplaceAddress" name="workplaceAddress" defaultValue={user.workplaceAddress || ""} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-nomineeName">Nominee Name</Label>
                  <Input id="edit-nomineeName" name="nomineeName" defaultValue={user.nomineeName || ""} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-nomineeRelation">Relation to Nominee</Label>
                  <Input id="edit-nomineeRelation" name="nomineeRelation" defaultValue={user.nomineeRelation || ""} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-nomineeDob">Nominee's Date of Birth</Label>
                  <Input id="edit-nomineeDob" name="nomineeDob" type="date" defaultValue={user.nomineeDob ? new Date(user.nomineeDob).toISOString().split('T')[0] : ""} />
                  {state?.error?.nomineeDob && <p className="text-xs text-destructive">{state.error.nomineeDob[0]}</p>}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2 justify-end border-t pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
