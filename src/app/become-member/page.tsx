
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
import { Check, Info, Library, ListChecks, Loader2, Milestone, ShieldCheck } from "lucide-react";
import { useActionState, useFormStatus } from "react-dom";
import { applyForMembership } from "./actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";


const initialState = {
    error: null,
    success: false
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button className="w-full" disabled={pending}>
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
    const [state, formAction] = useActionState(applyForMembership, initialState);
    const { toast } = useToast();

    useEffect(() => {
        if (state.error) {
            toast({
                variant: 'destructive',
                title: 'Application Failed',
                description: state.error
            })
        }
        if (state.success) {
            toast({
                title: 'Application Submitted!',
                description: 'Your membership application is now pending approval.'
            })
        }
    }, [state, toast])

  return (
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <ShieldCheck className="size-6 text-primary" />
            Membership Application
          </CardTitle>
          <CardDescription>
            Understand the requirements to become an active member and apply.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
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

            {state.success ? (
                <Alert variant="default" className="bg-green-600/10 border-green-600/30 text-green-700 dark:text-green-400">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertTitle>Application Submitted!</AlertTitle>
                    <AlertDescription>
                        Your application is now pending review by an administrator. You will be notified upon approval.
                    </AlertDescription>
                </Alert>
            ) : (
                <form action={formAction}>
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Ready to Apply?</AlertTitle>
                        <AlertDescription>
                        By clicking the button below, you confirm that you understand the requirements and wish to apply for membership. Your application will be sent for admin approval.
                        </AlertDescription>
                    </Alert>
                    <CardFooter className="px-0 pt-6 pb-0">
                        <SubmitButton />
                    </CardFooter>
                </form>
            )}
        </CardContent>
        
      </Card>
    </div>
  );
}
