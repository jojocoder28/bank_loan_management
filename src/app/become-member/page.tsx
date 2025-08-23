
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
import { Check, Info, Library, ListChecks, Loader2, Milestone, ShieldCheck, UserRound, Building, Banknote, Shield } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { applyForMembership } from "./actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { getMembershipStatus } from "./data-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
                    <Loader2 className="mr-2 animate-spin" /> Submitting Application...
                </>
            ) : "I Understand, Apply for Membership"
            }
        </Button>
    )
}

export default function BecomeMemberPage() {
    const [state, formAction] = useActionState(applyForMembership, initialState as any);
    const { toast } = useToast();
    const [hasApplied, setHasApplied] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      async function fetchStatus() {
        setIsLoading(true);
        const status = await getMembershipStatus();
        setHasApplied(status.membershipApplied);
        setIsLoading(false);
      }
      fetchStatus();
    }, [state.success]);

    useEffect(() => {
        if (state?.error) {
            const errorMsg = typeof state.error === 'object' ? Object.values(state.error).join(', ') : state.error;
            toast({
                variant: 'destructive',
                title: 'Application Failed',
                description: errorMsg
            })
        }
        if (state?.success) {
            toast({
                title: 'Application Submitted!',
                description: 'Your membership application is now pending approval.'
            })
        }
    }, [state, toast])
    
    if (isLoading) {
        return (
          <div className="flex justify-center items-start pt-8">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                 <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          </div>
        )
    }

    if (hasApplied) {
        return (
            <div className="flex justify-center items-start pt-8">
                 <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline">
                            <ShieldCheck className="size-6 text-primary" />
                            Membership Application
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                         <Alert variant="default" className="bg-green-600/10 border-green-600/30 text-green-700 dark:text-green-400">
                            <Check className="h-4 w-4 text-green-600" />
                            <AlertTitle>Application Submitted!</AlertTitle>
                            <AlertDescription>
                                Your application is now pending review by an administrator. You will be notified upon approval.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex justify-center items-start pt-8">
          <Card className="w-full max-w-4xl">
             <form action={formAction}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline">
                    <ShieldCheck className="size-6 text-primary" />
                    Membership Application
                  </CardTitle>
                  <CardDescription>
                    Fill out the form below to become an active member.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-8">
                    {/* Requirements Card */}
                    <Card className="bg-secondary/30">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><ListChecks className="size-5 text-primary"/>Membership Requirements</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 text-sm">
                            <div className="flex items-start gap-3">
                                <Milestone className="size-5 mt-1 text-accent"/>
                                <div>
                                    <h4 className="font-semibold">Initial Share Fund Deposit</h4>
                                    <p className="text-muted-foreground">You must make an initial deposit of <strong>₹5,000</strong> into your Share Fund (SFund). This is a one-time requirement upon joining.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Library className="size-5 mt-1 text-accent"/>
                                <div>
                                    <h4 className="font-semibold">Monthly Contribution</h4>
                                    <p className="text-muted-foreground">A recurring monthly contribution of <strong>₹1,000</strong> is required to maintain active membership status.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* Personal Details */}
                    <Card>
                        <CardHeader>
                             <CardTitle className="text-lg flex items-center gap-2"><UserRound className="size-5 text-primary"/>Personal Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input id="phone" name="phone" placeholder="e.g. 9876543210" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="personalAddress">Personal Address</Label>
                                <Input id="personalAddress" name="personalAddress" placeholder="e.g. 123 Main St, Anytown" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="age">Age</Label>
                                <Input id="age" name="age" type="number" placeholder="e.g. 30" required />
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
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* Professional Details */}
                     <Card>
                        <CardHeader>
                             <CardTitle className="text-lg flex items-center gap-2"><Building className="size-5 text-primary"/>Professional Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="profession">Profession</Label>
                                <Input id="profession" name="profession" placeholder="e.g. Software Engineer" required />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="workplace">Workplace</Label>
                                <Input id="workplace" name="workplace" placeholder="e.g. ABC Corporation" required />
                            </div>
                            <div className="md:col-span-2 grid gap-2">
                                <Label htmlFor="workplaceAddress">Workplace Address</Label>
                                <Input id="workplaceAddress" name="workplaceAddress" placeholder="e.g. 456 Business Ave, Worktown" required />
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* Bank Details */}
                     <Card>
                        <CardHeader>
                             <CardTitle className="text-lg flex items-center gap-2"><Banknote className="size-5 text-primary"/>Bank Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                             <div className="grid gap-2">
                                <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                                <Input id="bankAccountNumber" name="bankAccountNumber" placeholder="e.g. 123456789012" required />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Nominee Details */}
                    <Card>
                        <CardHeader>
                             <CardTitle className="text-lg flex items-center gap-2"><Shield className="size-5 text-primary"/>Nominee Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="nomineeName">Nominee's Full Name</Label>
                                <Input id="nomineeName" name="nomineeName" placeholder="e.g. Jane Doe" required />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="nomineeRelation">Relation to Nominee</Label>
                                <Input id="nomineeRelation" name="nomineeRelation" placeholder="e.g. Spouse" required />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="nomineeAge">Nominee's Age</Label>
                                <Input id="nomineeAge" name="nomineeAge" type="number" placeholder="e.g. 28" required />
                            </div>
                        </CardContent>
                    </Card>

                </CardContent>
                <CardFooter className="flex-col items-start gap-4">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Ready to Apply?</AlertTitle>
                        <AlertDescription>
                        By clicking the button below, you confirm that the information provided is accurate and you wish to apply for membership. Your application will be sent for admin approval.
                        </AlertDescription>
                    </Alert>
                    <SubmitButton />
                </CardFooter>
            </form>
          </Card>
        </div>
      );
}
