
"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  AlertTriangle,
  Banknote,
  Building,
  CalendarIcon,
  CheckCircle,
  ClipboardList,
  Loader2,
  Send,
  Shield,
  User,
  UserRound,
} from "lucide-react";
import { submitDataEntryForm } from "./actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
          <Loader2 className="mr-2 animate-spin" /> Submitting...
        </>
      ) : (
        <>
          <Send className="mr-2" /> Submit Information
        </>
      )}
    </Button>
  );
}

export default function DataEntryPage() {
  const [state, formAction] = useActionState(submitDataEntryForm, initialState as any);
  const [joinDate, setJoinDate] = useState<Date>();

  if (state.success) {
      return (
        <Card className="w-full max-w-lg text-center">
            <CardHeader className="items-center">
                <CheckCircle className="size-16 text-green-500 mb-4" />
                <CardTitle className="text-3xl">Submission Received!</CardTitle>
                <CardDescription>Thank you for submitting your information.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Your data has been sent for administrative review. You will be contacted once it has been processed. You can now close this window.</p>
            </CardContent>
        </Card>
      )
  }

  return (
    <Card className="w-full max-w-4xl">
      <form action={formAction}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <ClipboardList className="size-7" />
            Member Data Collection Form
          </CardTitle>
          <CardDescription>
            Please fill out this form with your accurate details. This information will be used to create your member profile in the Co-Operative Society's system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {state.error?.form && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Submission Failed</AlertTitle>
                    <AlertDescription>{state.error.form}</AlertDescription>
                </Alert>
            )}
             <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
                 <AccordionItem value="item-1">
                    <AccordionTrigger className="text-lg font-semibold"><UserRound className="mr-2" />Personal Details</AccordionTrigger>
                    <AccordionContent className="pt-4">
                        <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input id="fullName" name="fullName" required />
                                {state.error?.fullName && <p className="text-sm text-destructive">{state.error.fullName[0]}</p>}
                            </div>
                             <div className="grid gap-1.5">
                                <Label htmlFor="membershipNumber">Membership Number (if you have one)</Label>
                                <Input id="membershipNumber" name="membershipNumber" />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="phoneNumber">Phone Number</Label>
                                <Input id="phoneNumber" name="phoneNumber" type="tel" required />
                                {state.error?.phoneNumber && <p className="text-sm text-destructive">{state.error.phoneNumber[0]}</p>}
                            </div>
                             <div className="grid gap-1.5">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" name="email" type="email" />
                                {state.error?.email && <p className="text-sm text-destructive">{state.error.email[0]}</p>}
                            </div>
                             <div className="grid gap-1.5">
                                <Label htmlFor="personalAddress">Personal Address</Label>
                                <Input id="personalAddress" name="personalAddress" required />
                                {state.error?.personalAddress && <p className="text-sm text-destructive">{state.error.personalAddress[0]}</p>}
                            </div>
                             <div className="grid gap-1.5">
                                <Label htmlFor="joinDate">Date of Joining</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !joinDate && "text-muted-foreground"
                                        )}
                                        >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {joinDate ? format(joinDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                        mode="single"
                                        selected={joinDate}
                                        onSelect={setJoinDate}
                                        initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <input type="hidden" name="joinDate" value={joinDate?.toISOString() ?? ''} />
                                {state.error?.joinDate && <p className="text-sm text-destructive">{state.error.joinDate[0]}</p>}
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="age">Age</Label>
                                <Input id="age" name="age" type="number" required />
                                 {state.error?.age && <p className="text-sm text-destructive">{state.error.age[0]}</p>}
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="gender">Gender</Label>
                                <Select name="gender" required>
                                    <SelectTrigger id="gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                {state.error?.gender && <p className="text-sm text-destructive">{state.error.gender[0]}</p>}
                            </div>
                        </div>
                    </AccordionContent>
                 </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger className="text-lg font-semibold"><Building className="mr-2"/>Professional & Bank Details</AccordionTrigger>
                    <AccordionContent className="pt-4">
                        <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="profession">Profession</Label>
                                <Input id="profession" name="profession" required />
                                {state.error?.profession && <p className="text-sm text-destructive">{state.error.profession[0]}</p>}
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="workplace">Workplace (e.g., School Name)</Label>
                                <Input id="workplace" name="workplace" required />
                                 {state.error?.workplace && <p className="text-sm text-destructive">{state.error.workplace[0]}</p>}
                            </div>
                            <div className="md:col-span-2 grid gap-1.5">
                                <Label htmlFor="workplaceAddress">Workplace Address</Label>
                                <Input id="workplaceAddress" name="workplaceAddress" required />
                                {state.error?.workplaceAddress && <p className="text-sm text-destructive">{state.error.workplaceAddress[0]}</p>}
                            </div>
                            <div className="md:col-span-2 grid gap-1.5">
                                <Label htmlFor="bankAccountNumber">Salary Bank Account Number</Label>
                                <Input id="bankAccountNumber" name="bankAccountNumber" required />
                                {state.error?.bankAccountNumber && <p className="text-sm text-destructive">{state.error.bankAccountNumber[0]}</p>}
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                    <AccordionTrigger className="text-lg font-semibold"><Shield className="mr-2"/>Nominee Details</AccordionTrigger>
                    <AccordionContent className="pt-4">
                         <div className="grid md:grid-cols-3 gap-x-6 gap-y-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="nomineeName">Nominee's Full Name</Label>
                                <Input id="nomineeName" name="nomineeName" required />
                                 {state.error?.nomineeName && <p className="text-sm text-destructive">{state.error.nomineeName[0]}</p>}
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="nomineeRelation">Relation to Nominee</Label>
                                <Input id="nomineeRelation" name="nomineeRelation" required />
                                 {state.error?.nomineeRelation && <p className="text-sm text-destructive">{state.error.nomineeRelation[0]}</p>}
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="nomineeAge">Nominee's Age</Label>
                                <Input id="nomineeAge" name="nomineeAge" type="number" required />
                                 {state.error?.nomineeAge && <p className="text-sm text-destructive">{state.error.nomineeAge[0]}</p>}
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
             </Accordion>
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
