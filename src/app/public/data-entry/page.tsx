
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, Loader2, UserPlus, FileSignature, Building, Banknote, Shield } from "lucide-react";
import { useActionState, useEffect, useState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { submitPublicData } from "./actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const initialState = {
    error: null,
    success: false
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button className="w-full" type="submit" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 animate-spin" /> Submitting Data...
                </>
            ) : "Submit Data for Verification"
            }
        </Button>
    )
}

const years = Array.from({ length: 70 }, (_, i) => new Date().getFullYear() - i);
const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
];
const days = Array.from({ length: 31 }, (_, i) => i + 1);


export default function PublicDataEntryPage() {
    const [state, formAction] = useActionState(submitPublicData, initialState as any);
    const { toast } = useToast();

    useEffect(() => {
        if (state?.error) {
            const errorMsg = typeof state.error === 'object' ? Object.values(state.error).flat().join('\n') : state.error;
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: errorMsg,
            })
        }
        if (state?.success) {
            toast({
                title: 'Data Submitted!',
                description: 'Your information has been sent for verification by an administrator.'
            })
             // TODO: Reset the form fields
        }
    }, [state, toast])


    return (
        <div className="flex justify-center items-start pt-8 pb-12 bg-muted">
          <Card className="w-full max-w-4xl">
             <form action={formAction}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline">
                    <FileSignature className="size-6 text-primary" />
                    New Member Data Entry
                  </CardTitle>
                  <CardDescription>
                    Use this public form to submit new member data for administrative verification and bulk import.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                     {state.error?.form && (
                         <Alert variant="destructive">
                            <AlertDescription>{state.error.form}</AlertDescription>
                        </Alert>
                     )}
                     
                    {/* Personal Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2"><UserPlus className="size-5 text-primary"/> Personal Details</h3>
                        <div className="grid md:grid-cols-2 gap-6 pt-2">
                           <div className="grid gap-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input id="fullName" name="fullName" placeholder="e.g. John Doe" required />
                                {state.error?.fullName && <p className="text-sm text-destructive">{state.error.fullName[0]}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phoneNumber">Phone Number</Label>
                                <Input id="phoneNumber" name="phoneNumber" placeholder="A 10-digit mobile number" required />
                                 {state.error?.phoneNumber && <p className="text-sm text-destructive">{state.error.phoneNumber[0]}</p>}
                            </div>

                             <div className="grid gap-2">
                                <Label htmlFor="email">Email Address (Optional)</Label>
                                <Input id="email" name="email" type="email" placeholder="e.g. you@example.com" />
                                {state.error?.email && <p className="text-sm text-destructive">{state.error.email[0]}</p>}
                            </div>

                             <div className="grid gap-2">
                                <Label htmlFor="personalAddress">Personal Address</Label>
                                <Input id="personalAddress" name="personalAddress" placeholder="e.g. 123 Main St, Anytown" required />
                                {state.error?.personalAddress && <p className="text-sm text-destructive">{state.error.personalAddress[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="age">Age</Label>
                                <Input id="age" name="age" type="number" placeholder="e.g. 30" required />
                                {state.error?.age && <p className="text-sm text-destructive">{state.error.age[0]}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select name="gender" required>
                                    <SelectTrigger id="gender">
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                {state.error?.gender && <p className="text-sm text-destructive">{state.error.gender[0]}</p>}
                            </div>
                        </div>
                    </div>
                    
                    {/* Professional Details */}
                     <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2"><Building className="size-5 text-primary"/> Professional & Joining Details</h3>
                        <div className="grid md:grid-cols-2 gap-6 pt-2">
                            <div className="grid gap-2">
                                <Label htmlFor="profession">Profession</Label>
                                <Input id="profession" name="profession" placeholder="e.g. Primary School Teacher" required />
                                {state.error?.profession && <p className="text-sm text-destructive">{state.error.profession[0]}</p>}
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="workplace">Workplace (School Name)</Label>
                                <Input id="workplace" name="workplace" placeholder="e.g. Anytown Primary School" required />
                                {state.error?.workplace && <p className="text-sm text-destructive">{state.error.workplace[0]}</p>}
                            </div>
                            <div className="md:col-span-2 grid gap-2">
                                <Label htmlFor="workplaceAddress">Workplace Address</Label>
                                <Input id="workplaceAddress" name="workplaceAddress" placeholder="e.g. 456 Education Ave, Worktown" required />
                                {state.error?.workplaceAddress && <p className="text-sm text-destructive">{state.error.workplaceAddress[0]}</p>}
                            </div>

                             <div className="md:col-span-2 grid gap-2">
                                <Label>Joining Date</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <Select name="joinDay" required>
                                        <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
                                        <SelectContent>{days.map(d => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <Select name="joinMonth" required>
                                        <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                                        <SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <Select name="joinYear" required>
                                        <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                                        <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                {(state.error?.joinDay || state.error?.joinMonth || state.error?.joinYear) && <p className="text-sm text-destructive">A valid joining date is required.</p>}
                             </div>
                        </div>
                    </div>
                    
                    {/* Salary Account Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2"><Banknote className="size-5 text-primary"/> Salary Account Details</h3>
                        <div className="grid md:grid-cols-1 gap-6 pt-2">
                            <div className="p-3 rounded-md bg-secondary/50 border">
                                <p className="font-semibold">Bank Name: <span className="font-normal">The West Bengal State Co-Operative Bank Limited</span></p>
                                <p className="font-semibold">IFSC: <span className="font-normal">WBSC0000016</span></p>
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                                <Input id="bankAccountNumber" name="bankAccountNumber" placeholder="e.g. 123456789012" required />
                                {state.error?.bankAccountNumber && <p className="text-sm text-destructive">{state.error.bankAccountNumber[0]}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Nominee Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2"><Shield className="size-5 text-primary"/> Nominee Details</h3>
                        <div className="grid md:grid-cols-3 gap-6 pt-2">
                            <div className="grid gap-2">
                                <Label htmlFor="nomineeName">Nominee's Full Name</Label>
                                <Input id="nomineeName" name="nomineeName" placeholder="e.g. Jane Doe" required />
                                {state.error?.nomineeName && <p className="text-sm text-destructive">{state.error.nomineeName[0]}</p>}
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="nomineeRelation">Relation to Nominee</Label>
                                <Input id="nomineeRelation" name="nomineeRelation" placeholder="e.g. Spouse" required />
                                 {state.error?.nomineeRelation && <p className="text-sm text-destructive">{state.error.nomineeRelation[0]}</p>}
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="nomineeAge">Nominee's Age</Label>
                                <Input id="nomineeAge" name="nomineeAge" type="number" placeholder="e.g. 28" required />
                                {state.error?.nomineeAge && <p className="text-sm text-destructive">{state.error.nomineeAge[0]}</p>}
                            </div>
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="flex-col items-start gap-4 border-t pt-6">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Confirm Submission</AlertTitle>
                        <AlertDescription>
                        By clicking the button below, you confirm that the information provided is accurate. This data will be sent to a bank administrator for verification and import.
                        </AlertDescription>
                    </Alert>
                    <SubmitButton />
                </CardFooter>
            </form>
          </Card>
        </div>
      );
}
