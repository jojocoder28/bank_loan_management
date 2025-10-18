
"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitDataEntry } from "./actions";
import { AlertTriangle, CheckCircle, Loader2, UserPlus, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { DateSelector } from "./_components/date-selector";

const initialState = {
  error: null,
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 animate-spin" />
          Submitting Data...
        </>
      ) : (
        "Submit Data"
      )}
    </Button>
  );
}

export default function PublicDataEntryPage() {
  const [state, formAction] = useActionState(submitDataEntry, initialState as any);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.error) {
      const errorMsg = typeof state.error === 'object' 
        ? Object.values(state.error).flat().join(', ')
        : state.error;
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: errorMsg,
      });
    }
  }, [state, toast]);
  
  if (state.success) {
    return (
        <div className="flex min-h-[80vh] items-center justify-center bg-background p-4">
            <Card className="mx-auto max-w-lg w-full text-center">
                <CardHeader>
                    <CheckCircle className="mx-auto size-16 text-green-500 mb-4" />
                    <CardTitle className="text-2xl">Submission Successful</CardTitle>
                    <CardDescription>
                        The member data has been successfully submitted and is now available for the administrator to review.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Button onClick={() => window.location.reload()} className="w-full">
                        Submit Another Entry
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="flex justify-center items-start py-8">
    <form action={formAction} className="w-full max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus />
            Public Member Data Entry
          </CardTitle>
          <CardDescription>
            Submit new member information here. This data will be available for review and bulk import by an administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
           {state?.error?.form && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Submission Error</AlertTitle>
                    <AlertDescription>{state.error.form}</AlertDescription>
                </Alert>
            )}

            {/* Personal Info */}
            <div className="space-y-4">
                 <h3 className="text-lg font-medium border-b pb-2">Personal Information</h3>
                 <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" name="fullName" placeholder="e.g., John Doe" required />
                         {state?.error?.fullName && <p className="text-sm text-destructive">{state.error.fullName[0]}</p>}
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="membershipNumber">Membership Number (Optional)</Label>
                        <Input id="membershipNumber" name="membershipNumber" placeholder="e.g., 123" />
                         {state?.error?.membershipNumber && <p className="text-sm text-destructive">{state.error.membershipNumber[0]}</p>}
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input id="phoneNumber" name="phoneNumber" type="tel" placeholder="e.g., 9876543210" required />
                         {state?.error?.phoneNumber && <p className="text-sm text-destructive">{state.error.phoneNumber[0]}</p>}
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="email">Email (Optional)</Label>
                        <Input id="email" name="email" type="email" placeholder="e.g., john.doe@example.com" />
                         {state?.error?.email && <p className="text-sm text-destructive">{state.error.email[0]}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label>Joining Date</Label>
                        <DateSelector />
                         {state?.error?.joinDate && <p className="text-sm text-destructive">{state.error.joinDate[0]}</p>}
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="age">Age</Label>
                        <Input id="age" name="age" type="number" placeholder="e.g., 35" required />
                         {state?.error?.age && <p className="text-sm text-destructive">{state.error.age[0]}</p>}
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="personalAddress">Personal Address</Label>
                        <Input id="personalAddress" name="personalAddress" placeholder="e.g., 123 Main St, Anytown" required />
                         {state?.error?.personalAddress && <p className="text-sm text-destructive">{state.error.personalAddress[0]}</p>}
                    </div>
                 </div>
            </div>

            {/* Professional Info */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Professional & Bank Information</h3>
                 <div className="grid md:grid-cols-2 gap-4">
                     <div className="grid gap-2">
                        <Label htmlFor="profession">Profession</Label>
                        <Input id="profession" name="profession" placeholder="e.g., Teacher" required />
                         {state?.error?.profession && <p className="text-sm text-destructive">{state.error.profession[0]}</p>}
                    </div>
                      <div className="grid gap-2">
                        <Label htmlFor="workplace">Workplace</Label>
                        <Input id="workplace" name="workplace" placeholder="e.g., Anytown Primary School" required />
                         {state?.error?.workplace && <p className="text-sm text-destructive">{state.error.workplace[0]}</p>}
                    </div>
                     <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="workplaceAddress">Workplace Address</Label>
                        <Input id="workplaceAddress" name="workplaceAddress" placeholder="e.g., 456 School Rd, Anytown" required />
                         {state?.error?.workplaceAddress && <p className="text-sm text-destructive">{state.error.workplaceAddress[0]}</p>}
                    </div>
                     <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="bankAccountNumber">Salary Bank Account Number</Label>
                        <Input id="bankAccountNumber" name="bankAccountNumber" placeholder="e.g., 9876543210" required />
                         {state?.error?.bankAccountNumber && <p className="text-sm text-destructive">{state.error.bankAccountNumber[0]}</p>}
                    </div>
                     <div className="md:col-span-2 p-3 rounded-md bg-secondary/50 border">
                        <p className="font-semibold">Bank Name: <span className="font-normal">The West Bengal State Co-Operative Bank Limited</span></p>
                        <p className="font-semibold">IFSC: <span className="font-normal">WBSC0000016</span></p>
                    </div>
                </div>
            </div>

            {/* Nominee Info */}
            <div className="space-y-4">
                 <h3 className="text-lg font-medium border-b pb-2">Nominee Information</h3>
                <div className="grid md:grid-cols-3 gap-4">
                     <div className="grid gap-2">
                        <Label htmlFor="nomineeName">Nominee's Full Name</Label>
                        <Input id="nomineeName" name="nomineeName" placeholder="e.g., Jane Doe" required />
                         {state?.error?.nomineeName && <p className="text-sm text-destructive">{state.error.nomineeName[0]}</p>}
                    </div>
                      <div className="grid gap-2">
                        <Label htmlFor="nomineeRelation">Relation</Label>
                        <Input id="nomineeRelation" name="nomineeRelation" placeholder="e.g., Spouse" required />
                         {state?.error?.nomineeRelation && <p className="text-sm text-destructive">{state.error.nomineeRelation[0]}</p>}
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="nomineeAge">Nominee's Age</Label>
                        <Input id="nomineeAge" name="nomineeAge" type="number" placeholder="e.g., 34" required />
                         {state?.error?.nomineeAge && <p className="text-sm text-destructive">{state.error.nomineeAge[0]}</p>}
                    </div>
                </div>
            </div>

        </CardContent>
        <CardFooter className="flex-col items-start gap-4 border-t pt-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Please double-check all information before submitting.</AlertTitle>
              <AlertDescription>
                Ensure all details are correct to prevent issues during the import process.
              </AlertDescription>
            </Alert>
            <SubmitButton />
        </CardFooter>
      </Card>
    </form>
    </div>
  );
}
