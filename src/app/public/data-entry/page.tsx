
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  Send,
  AlertTriangle,
  UserRound,
  Building,
  Banknote,
  Shield,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { submitDataEntryForm } from "./actions";

const initialState = {
  error: null,
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <Loader2 className="mr-2 animate-spin" />
      ) : (
        <Send className="mr-2" />
      )}
      Submit Information
    </Button>
  );
}

export default function DataEntryPage() {
  const [state, formAction] = useActionState(submitDataEntryForm, initialState);
  const { toast } = useToast();
  const [formKey, setFormKey] = useState(Date.now()); // Used to reset the form

  useEffect(() => {
    if (state.error) {
      const errorMsg =
        typeof state.error === "object"
          ? Object.values(state.error).flat().join("\n")
          : state.error;
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: errorMsg,
      });
    }
    if (state.success) {
      toast({
        title: "Information Submitted!",
        description:
          "Thank you. Your data has been recorded for the bulk import process.",
      });
      // Reset the form by changing the key of the form element
      setFormKey(Date.now());
    }
  }, [state, toast]);

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <form action={formAction} key={formKey}>
          <CardHeader>
            <CardTitle>Bulk Import Data Collection Form</CardTitle>
            <CardDescription>
              Please fill out this form accurately. Your information will be
              used by the society's administrator to include you in the next
              bulk data import.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {state.error?.form && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Submission Error</AlertTitle>
                <AlertDescription>{state.error.form}</AlertDescription>
              </Alert>
            )}

            <section className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <UserRound /> Personal Details
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" name="fullName" required />
                  {state.error?.fullName && <p className="text-sm text-destructive">{state.error.fullName[0]}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="membershipNumber">Membership Number (if you have one)</Label>
                  <Input id="membershipNumber" name="membershipNumber" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input id="phoneNumber" name="phoneNumber" type="tel" required />
                   {state.error?.phoneNumber && <p className="text-sm text-destructive">{state.error.phoneNumber[0]}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" name="email" type="email" />
                   {state.error?.email && <p className="text-sm text-destructive">{state.error.email[0]}</p>}
                </div>
                 <div className="space-y-1.5">
                  <Label htmlFor="joinDate">Date of Joining</Label>
                  <Input id="joinDate" name="joinDate" type="date" required />
                   {state.error?.joinDate && <p className="text-sm text-destructive">{state.error.joinDate[0]}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="personalAddress">Personal Address</Label>
                  <Input id="personalAddress" name="personalAddress" required />
                   {state.error?.personalAddress && <p className="text-sm text-destructive">{state.error.personalAddress[0]}</p>}
                </div>
                 <div className="space-y-1.5">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" name="age" type="number" required />
                   {state.error?.age && <p className="text-sm text-destructive">{state.error.age[0]}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gender">Gender</Label>
                  <Select name="gender" required>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                   {state.error?.gender && <p className="text-sm text-destructive">{state.error.gender[0]}</p>}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Building /> Professional & Bank Details
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="profession">Profession</Label>
                  <Input id="profession" name="profession" required />
                   {state.error?.profession && <p className="text-sm text-destructive">{state.error.profession[0]}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="workplace">Workplace</Label>
                  <Input id="workplace" name="workplace" required />
                  {state.error?.workplace && <p className="text-sm text-destructive">{state.error.workplace[0]}</p>}
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label htmlFor="workplaceAddress">Workplace Address</Label>
                  <Input id="workplaceAddress" name="workplaceAddress" required />
                  {state.error?.workplaceAddress && <p className="text-sm text-destructive">{state.error.workplaceAddress[0]}</p>}
                </div>
                 <div className="md:col-span-2 space-y-1.5">
                  <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                  <Input id="bankAccountNumber" name="bankAccountNumber" required />
                   {state.error?.bankAccountNumber && <p className="text-sm text-destructive">{state.error.bankAccountNumber[0]}</p>}
                </div>
              </div>
            </section>
            
            <section className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Shield /> Nominee Details
              </h3>
               <div className="grid md:grid-cols-3 gap-4">
                 <div className="space-y-1.5">
                    <Label htmlFor="nomineeName">Nominee's Full Name</Label>
                    <Input id="nomineeName" name="nomineeName" required />
                    {state.error?.nomineeName && <p className="text-sm text-destructive">{state.error.nomineeName[0]}</p>}
                </div>
                 <div className="space-y-1.5">
                    <Label htmlFor="nomineeRelation">Relation</Label>
                    <Input id="nomineeRelation" name="nomineeRelation" required />
                    {state.error?.nomineeRelation && <p className="text-sm text-destructive">{state.error.nomineeRelation[0]}</p>}
                </div>
                 <div className="space-y-1.5">
                    <Label htmlFor="nomineeAge">Nominee's Age</Label>
                    <Input id="nomineeAge" name="nomineeAge" type="number" required />
                    {state.error?.nomineeAge && <p className="text-sm text-destructive">{state.error.nomineeAge[0]}</p>}
                </div>
              </div>
            </section>


          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
