
"use client";

import { useActionState, useEffect, useState, useRef } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UserPlus, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { submitDataEntryForm } from "./actions";
import { DateInput } from "./_components/date-input";
import { useToast } from "@/hooks/use-toast";


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
        "Submit Member Data"
      )}
    </Button>
  );
}

export default function DataEntryPage() {
    const [state, formAction] = useActionState(submitDataEntryForm, initialState);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

     useEffect(() => {
        if (state?.error) {
            const errorMsg = typeof state.error === 'object' 
                ? Object.values(state.error).flat().join('\n') 
                : state.error;
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: errorMsg,
            });
        }
        if (state?.success) {
            toast({
                title: 'Success!',
                description: "The member's data has been successfully submitted.",
            });
            formRef.current?.reset();
        }
    }, [state, toast]);
    

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="mx-auto max-w-2xl w-full">
        <form ref={formRef} action={formAction}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <FileText />
              New Member Data Entry
            </CardTitle>
            <CardDescription>
              Submit the details for a new member. This data will be available for the administrator to review and import.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {state?.error?.form && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{state.error.form}</AlertDescription>
                </Alert>
            )}
             {state?.success && (
                <Alert variant="default" className="bg-green-600/10 border-green-600/30 text-green-700 dark:text-green-400">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle>Submission Successful!</AlertTitle>
                    <AlertDescription>The member's data has been recorded and is now waiting for admin export.</AlertDescription>
                </Alert>
             )}
            
            {/* Personal Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Personal Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" name="fullName" placeholder="e.g., Jane Doe" required />
                  {state?.error?.fullName && <p className="text-sm text-destructive">{state.error.fullName[0]}</p>}
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="membershipNumber">Membership Number</Label>
                  <Input id="membershipNumber" name="membershipNumber" placeholder="e.g., 12345" />
                  {state?.error?.membershipNumber && <p className="text-sm text-destructive">{state.error.membershipNumber[0]}</p>}
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input id="phoneNumber" name="phoneNumber" type="tel" placeholder="e.g., 9876543210" required />
                  {state?.error?.phoneNumber && <p className="text-sm text-destructive">{state.error.phoneNumber[0]}</p>}
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input id="email" name="email" type="email" placeholder="e.g., jane.doe@example.com" />
                  {state?.error?.email && <p className="text-sm text-destructive">{state.error.email[0]}</p>}
                </div>
                <div className="grid gap-1.5">
                   <Label htmlFor="joinDate">Joining Date</Label>
                   <DateInput name="joinDate" />
                   {state?.error?.joinDate && <p className="text-sm text-destructive">{state.error.joinDate[0]}</p>}
                </div>
                 <div className="grid gap-1.5">
                  <Label htmlFor="personalAddress">Personal Address</Label>
                  <Input id="personalAddress" name="personalAddress" required />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" name="age" type="number" required />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="gender">Gender</Label>
                  <Input id="gender" name="gender" required />
                </div>
              </div>
            </div>

            {/* Professional Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Professional & Bank Details</h3>
               <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                    <Label htmlFor="profession">Profession</Label>
                    <Input id="profession" name="profession" required />
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="workplace">Workplace</Label>
                    <Input id="workplace" name="workplace" required />
                </div>
                <div className="md:col-span-2 grid gap-1.5">
                    <Label htmlFor="workplaceAddress">Workplace Address</Label>
                    <Input id="workplaceAddress" name="workplaceAddress" required />
                </div>
                <div className="md:col-span-2 grid gap-1.5">
                    <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                    <Input id="bankAccountNumber" name="bankAccountNumber" required />
                </div>
               </div>
            </div>

            {/* Nominee Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Nominee Details</h3>
               <div className="grid md:grid-cols-3 gap-4">
                <div className="grid gap-1.5">
                    <Label htmlFor="nomineeName">Nominee Full Name</Label>
                    <Input id="nomineeName" name="nomineeName" required />
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="nomineeRelation">Relation to Nominee</Label>
                    <Input id="nomineeRelation" name="nomineeRelation" required />
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="nomineeAge">Nominee Age</Label>
                    <Input id="nomineeAge" name="nomineeAge" type="number" required />
                </div>
               </div>
            </div>

          </CardContent>
          <CardFooter className="border-t pt-6">
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
