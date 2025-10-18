"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { submitDataEntryForm } from "./actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  UserPlus,
  Loader2,
  AlertTriangle,
  UserRound,
  Building,
  Banknote,
  Shield,
  CheckCircle,
  Calendar as CalendarIcon
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

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
  const [state, formAction] = useActionState(submitDataEntryForm, initialState as any);
  const { toast } = useToast();
  const [joinDate, setJoinDate] = useState<Date | undefined>();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error) {
       const errorMsg = typeof state.error === 'object' 
        ? Object.values(state.error).flat().join(', ')
        : state.error;
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: errorMsg,
      });
    }
    if (state.success) {
      toast({
        title: "Success!",
        description: "Your data has been submitted successfully.",
      });
      formRef.current?.reset();
      setJoinDate(undefined);
    }
  }, [state, toast]);

  return (
    <div className="min-h-screen bg-muted/40 py-8 px-4 flex justify-center items-start">
        <form action={formAction} ref={formRef} className="w-full max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus />
                        New Member Data Entry
                    </CardTitle>
                    <CardDescription>
                        Fill out this form to submit a new member's details. The data will be available for export by the administrator.
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
                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><UserRound className="size-5 text-primary"/>Personal Details</h3>
                        <div className="grid md:grid-cols-2 gap-x-6 gap-y-4 p-6 border rounded-lg bg-background">
                            <div className="grid gap-1.5">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input id="fullName" name="fullName" placeholder="e.g. John Doe" required />
                                {state?.error?.fullName && <p className="text-sm text-destructive">{state.error.fullName[0]}</p>}
                            </div>
                             <div className="grid gap-1.5">
                                <Label htmlFor="phoneNumber">Phone Number</Label>
                                <Input id="phoneNumber" name="phoneNumber" placeholder="e.g. 9876543210" required />
                                {state?.error?.phoneNumber && <p className="text-sm text-destructive">{state.error.phoneNumber[0]}</p>}
                            </div>
                             <div className="grid gap-1.5">
                                <Label htmlFor="email">Email Address (Optional)</Label>
                                <Input id="email" name="email" type="email" placeholder="e.g. john.doe@example.com" />
                                {state?.error?.email && <p className="text-sm text-destructive">{state.error.email[0]}</p>}
                            </div>
                             <div className="grid gap-1.5">
                                <Label htmlFor="personalAddress">Personal Address</Label>
                                <Input id="personalAddress" name="personalAddress" placeholder="e.g. 123 Main St, Anytown" required />
                                {state?.error?.personalAddress && <p className="text-sm text-destructive">{state.error.personalAddress[0]}</p>}
                            </div>
                             <div className="grid gap-1.5">
                                <Label htmlFor="age">Age</Label>
                                <Input id="age" name="age" type="number" placeholder="e.g. 30" required />
                                {state?.error?.age && <p className="text-sm text-destructive">{state.error.age[0]}</p>}
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
                                {state?.error?.gender && <p className="text-sm text-destructive">{state.error.gender[0]}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Professional & Bank Details */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Building className="size-5 text-primary"/>Professional & Bank Details</h3>
                        <div className="grid md:grid-cols-2 gap-x-6 gap-y-4 p-6 border rounded-lg bg-background">
                             <div className="grid gap-1.5">
                                <Label htmlFor="membershipNumber">Membership Number</Label>
                                <Input id="membershipNumber" name="membershipNumber" placeholder="e.g. 12345" required />
                                {state?.error?.membershipNumber && <p className="text-sm text-destructive">{state.error.membershipNumber[0]}</p>}
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="joinDate">Joining Date</Label>
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
                                <input type="hidden" name="joinDate" value={joinDate ? joinDate.toISOString() : ""} />
                                {state?.error?.joinDate && <p className="text-sm text-destructive">{state.error.joinDate[0]}</p>}
                            </div>
                             <div className="grid gap-1.5">
                                <Label htmlFor="profession">Profession</Label>
                                <Input id="profession" name="profession" placeholder="e.g. Primary School Teacher" required />
                                {state?.error?.profession && <p className="text-sm text-destructive">{state.error.profession[0]}</p>}
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="workplace">Workplace (School Name)</Label>
                                <Input id="workplace" name="workplace" placeholder="e.g. Anytown Primary School" required />
                                {state?.error?.workplace && <p className="text-sm text-destructive">{state.error.workplace[0]}</p>}
                            </div>
                            <div className="md:col-span-2 grid gap-1.5">
                                <Label htmlFor="workplaceAddress">Workplace Address</Label>
                                <Input id="workplaceAddress" name="workplaceAddress" placeholder="e.g. 456 Education Ave, Worktown" required />
                                {state?.error?.workplaceAddress && <p className="text-sm text-destructive">{state.error.workplaceAddress[0]}</p>}
                            </div>
                            <div className="md:col-span-2 grid gap-1.5">
                                <Label htmlFor="bankAccountNumber">Salary Bank Account Number</Label>
                                <Input id="bankAccountNumber" name="bankAccountNumber" placeholder="e.g. 123456789012" required />
                                {state?.error?.bankAccountNumber && <p className="text-sm text-destructive">{state.error.bankAccountNumber[0]}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Nominee Details */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Shield className="size-5 text-primary"/>Nominee Details</h3>
                        <div className="grid md:grid-cols-3 gap-x-6 gap-y-4 p-6 border rounded-lg bg-background">
                            <div className="grid gap-1.5">
                                <Label htmlFor="nomineeName">Nominee's Full Name</Label>
                                <Input id="nomineeName" name="nomineeName" placeholder="e.g. Jane Doe" required />
                                {state?.error?.nomineeName && <p className="text-sm text-destructive">{state.error.nomineeName[0]}</p>}
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="nomineeRelation">Relation to Nominee</Label>
                                <Input id="nomineeRelation" name="nomineeRelation" placeholder="e.g. Spouse" required />
                                {state?.error?.nomineeRelation && <p className="text-sm text-destructive">{state.error.nomineeRelation[0]}</p>}
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="nomineeAge">Nominee's Age</Label>
                                <Input id="nomineeAge" name="nomineeAge" type="number" placeholder="e.g. 28" required />
                                {state?.error?.nomineeAge && <p className="text-sm text-destructive">{state.error.nomineeAge[0]}</p>}
                            </div>
                        </div>
                    </div>
                    
                </CardContent>
                <CardFooter className="flex flex-col items-center gap-4 border-t pt-6">
                     <SubmitButton />
                </CardFooter>
            </Card>
        </form>
    </div>
  );
}
