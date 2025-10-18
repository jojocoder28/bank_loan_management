
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
import { submitPublicData } from "./actions";
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
          Submitting...
        </>
      ) : (
        "Submit Data"
      )}
    </Button>
  );
}

export default function PublicDataEntryPage() {
    const [state, formAction] = useActionState(submitPublicData, initialState as any);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (state?.error) {
            const errorMsg = typeof state.error === 'object' ? Object.values(state.error).join(', ') : state.error;
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: errorMsg,
            });
        }
        if (state?.success) {
            toast({
                title: 'Success!',
                description: 'Data has been submitted for review.',
            });
            setShowSuccess(true);
            formRef.current?.reset();
        }
    }, [state, toast]);

    if (showSuccess) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Card className="w-full max-w-2xl text-center">
                    <CardHeader>
                        <CheckCircle className="mx-auto size-16 text-green-500" />
                        <CardTitle className="mt-4">Submission Successful!</CardTitle>
                        <CardDescription>
                            Your information has been sent to the administrators for review.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Thank you for submitting your details. You can now close this page or submit another entry.</p>
                    </CardContent>
                    <CardFooter>
                         <Button onClick={() => setShowSuccess(false)} className="w-full">
                            Submit Another Entry
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex justify-center items-start py-12 px-4">
            <Card className="w-full max-w-4xl">
                 <form action={formAction} ref={formRef}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                            <UserPlus className="size-6 text-primary" />
                            Co-operative Member Data Entry
                        </CardTitle>
                        <CardDescription>
                            Please fill out the form below with the member's details. This information will be sent to an administrator for verification and import.
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
                        
                        {/* Personal Details */}
                        <div className="space-y-4 p-6 border rounded-lg">
                            <h3 className="text-lg font-semibold border-b pb-2">Personal Details</h3>
                            <div className="grid md:grid-cols-2 gap-6 pt-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input id="fullName" name="fullName" placeholder="e.g. John Doe" required />
                                     {state?.error?.fullName && <p className="text-sm text-destructive">{state.error.fullName[0]}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="membershipNumber">Membership Number (if available)</Label>
                                    <Input id="membershipNumber" name="membershipNumber" placeholder="e.g. 12345" />
                                </div>
                                 <div className="grid gap-2">
                                    <Label htmlFor="phoneNumber">Phone Number</Label>
                                    <Input id="phoneNumber" name="phoneNumber" type="tel" placeholder="e.g. 9876543210" required />
                                    {state?.error?.phoneNumber && <p className="text-sm text-destructive">{state.error.phoneNumber[0]}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email Address (Optional)</Label>
                                    <Input id="email" name="email" type="email" placeholder="e.g. john.doe@example.com" />
                                    {state?.error?.email && <p className="text-sm text-destructive">{state.error.email[0]}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="personalAddress">Personal Address</Label>
                                    <Input id="personalAddress" name="personalAddress" placeholder="e.g. 123 Main St, Anytown" required />
                                     {state?.error?.personalAddress && <p className="text-sm text-destructive">{state.error.personalAddress[0]}</p>}
                                </div>
                               <div className="grid gap-2">
                                    <Label>Joining Date</Label>
                                    <DateSelector />
                                    {(state?.error?.day || state?.error?.month || state?.error?.year) && 
                                        <p className="text-sm text-destructive">Please provide a valid day, month, and year.</p>
                                    }
                                </div>
                                 <div className="grid gap-2">
                                    <Label htmlFor="age">Age</Label>
                                    <Input id="age" name="age" type="number" placeholder="e.g. 35" required />
                                    {state?.error?.age && <p className="text-sm text-destructive">{state.error.age[0]}</p>}
                                </div>
                                 <div className="grid gap-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <select name="gender" id="gender" required className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                    {state?.error?.gender && <p className="text-sm text-destructive">{state.error.gender[0]}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Professional & Bank Details */}
                        <div className="space-y-4 p-6 border rounded-lg">
                            <h3 className="text-lg font-semibold border-b pb-2">Professional & Bank Details</h3>
                             <div className="grid md:grid-cols-2 gap-6 pt-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="profession">Profession</Label>
                                    <Input id="profession" name="profession" placeholder="e.g. Teacher" required />
                                    {state?.error?.profession && <p className="text-sm text-destructive">{state.error.profession[0]}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="workplace">Workplace (School Name)</Label>
                                    <Input id="workplace" name="workplace" placeholder="e.g. Anytown Primary School" required />
                                    {state?.error?.workplace && <p className="text-sm text-destructive">{state.error.workplace[0]}</p>}
                                </div>
                                <div className="md:col-span-2 grid gap-2">
                                    <Label htmlFor="workplaceAddress">Workplace Address</Label>
                                    <Input id="workplaceAddress" name="workplaceAddress" placeholder="e.g. 456 Education Ave, Schooltown" required />
                                    {state?.error?.workplaceAddress && <p className="text-sm text-destructive">{state.error.workplaceAddress[0]}</p>}
                                </div>
                                 <div className="md:col-span-2 grid gap-2">
                                    <Label htmlFor="bankAccountNumber">Salary Bank Account Number</Label>
                                    <Input id="bankAccountNumber" name="bankAccountNumber" placeholder="e.g. 123456789012" required />
                                    {state?.error?.bankAccountNumber && <p className="text-sm text-destructive">{state.error.bankAccountNumber[0]}</p>}
                                </div>
                                  <div className="md:col-span-2 p-3 rounded-md bg-secondary/50 border">
                                    <p className="font-semibold">Bank Name: <span className="font-normal">The West Bengal State Co-Operative Bank Limited</span></p>
                                    <p className="font-semibold">IFSC: <span className="font-normal">WBSC0000016</span></p>
                                 </div>
                            </div>
                        </div>

                         {/* Nominee Details */}
                        <div className="space-y-4 p-6 border rounded-lg">
                            <h3 className="text-lg font-semibold border-b pb-2">Nominee Details</h3>
                            <div className="grid md:grid-cols-3 gap-6 pt-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="nomineeName">Nominee's Full Name</Label>
                                    <Input id="nomineeName" name="nomineeName" placeholder="e.g. Jane Doe" required />
                                    {state?.error?.nomineeName && <p className="text-sm text-destructive">{state.error.nomineeName[0]}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="nomineeRelation">Relation to Nominee</Label>
                                    <Input id="nomineeRelation" name="nomineeRelation" placeholder="e.g. Spouse" required />
                                    {state?.error?.nomineeRelation && <p className="text-sm text-destructive">{state.error.nomineeRelation[0]}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="nomineeAge">Nominee's Age</Label>
                                    <Input id="nomineeAge" name="nomineeAge" type="number" placeholder="e.g. 32" required />
                                    {state?.error?.nomineeAge && <p className="text-sm text-destructive">{state.error.nomineeAge[0]}</p>}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-4">
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Confirmation</AlertTitle>
                            <AlertDescription>
                                By submitting this form, you confirm that the information provided is accurate. It will be sent to an administrator for review before being imported.
                            </AlertDescription>
                        </Alert>
                        <SubmitButton />
                    </CardFooter>
                 </form>
            </Card>
        </div>
    );
}
