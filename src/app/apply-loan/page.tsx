
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
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { calculateRequiredFunds } from "@/lib/coop-calculations";
import { Handshake, Info, AlertTriangle, CheckCircle2, Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import { applyForLoan } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { getUserFundsAndStatus } from "./data-actions";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

const initialState = {
  error: null,
};

function SubmitButton({ disabled }: { disabled: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={disabled || pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 animate-spin" /> Submitting...
                </>
            ) : "Submit Loan Application"
            }
        </Button>
    )
}

export default function ApplyLoanPage() {
  const [loanAmount, setLoanAmount] = useState(100000);
  const [monthlyPrincipal, setMonthlyPrincipal] = useState(2000);
  const [userData, setUserData] = useState({ shareFund: 0, guaranteedFund: 0, role: 'user' });
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();
  const [state, formAction] = useActionState(applyForLoan, initialState);

  useEffect(() => {
    async function fetchUserData() {
      setIsLoading(true);
      const data = await getUserFundsAndStatus();
      setUserData(data);
      setIsLoading(false);
    }
    fetchUserData();
  }, []);
  
  useEffect(() => {
      if(state?.error) {
          toast({
              variant: 'destructive',
              title: 'Application Failed',
              description: state.error
          })
      }
  }, [state, toast])


  if (isLoading) {
    return (
      <div className="flex justify-center items-start pt-8">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="grid gap-8">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userData.role !== 'member') {
    return (
      <div className="flex justify-center items-start pt-8">
        <Card className="w-full max-w-lg text-center">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-center"><ShieldCheck className="size-8 text-primary"/> Become a Member</CardTitle>
                <CardDescription>You must be an active and approved member to apply for a loan.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Your account is not registered as a member. Please apply for membership to access loan services.</p>
            </CardContent>
            <CardFooter>
                <Button asChild className="w-full">
                    <Link href="/become-member">Apply for Membership <ArrowRight className="ml-2" /></Link>
                </Button>
            </CardFooter>
        </Card>
      </div>
    )
  }

  const { requiredShare, requiredGuaranteed } = calculateRequiredFunds(loanAmount);
  
  const shareFundShortfall = Math.max(0, requiredShare - userData.shareFund);
  const guaranteedFundShortfall = Math.max(0, requiredGuaranteed - userData.guaranteedFund);
  const totalShortfall = shareFundShortfall + guaranteedFundShortfall;

  return (
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-4xl">
        <form action={formAction}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Handshake className="size-6" />
            Apply for a New Loan
          </CardTitle>
          <CardDescription>
            Enter your desired loan amount and see the requirements based on your funds.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8">
            <input type="hidden" name="loanAmount" value={loanAmount} />
            <input type="hidden" name="monthlyPrincipal" value={monthlyPrincipal} />
            
          <div className="grid md:grid-cols-2 gap-8">
              <div className="grid gap-8">
                <div className="grid gap-2">
                    <Label htmlFor="loan-amount">Loan Amount (Rs.)</Label>
                     <Input
                        id="loan-amount"
                        type="number"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(Number(e.target.value))}
                        className="text-lg font-bold"
                        step={1000}
                    />
                    <Slider
                        value={[loanAmount]}
                        onValueChange={(value) => setLoanAmount(value[0])}
                        min={10000}
                        max={500000}
                        step={5000}
                    />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="monthly-principal">Your Chosen Monthly Principal Payment (Rs.)</Label>
                    <Input
                        type="number"
                        id="monthly-principal"
                        value={monthlyPrincipal}
                        onChange={(e) => setMonthlyPrincipal(Number(e.target.value))}
                        className="text-lg font-bold"
                        step={500}
                    />
                     <Slider
                      value={[monthlyPrincipal]}
                      onValueChange={(value) => setMonthlyPrincipal(value[0])}
                      min={1000}
                      max={10000}
                      step={500}
                    />
                  </div>
              </div>

              <div className="grid gap-6">
                 <Card className="bg-secondary/30">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><Info className="size-5 text-primary"/>Loan Requirements</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm">
                        <p className="text-xs text-muted-foreground">You must have 5% of the loan amount in your Share Fund and another 5% in your Guaranteed Fund.</p>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Required Share Fund</span>
                            <span className="font-medium">Rs. {requiredShare.toLocaleString()}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Required Guaranteed Fund</span>
                            <span className="font-medium">Rs. {requiredGuaranteed.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t pt-2 mt-1">
                            <span>Your Share Fund</span>
                            <span>Rs. {userData.shareFund.toLocaleString()}</span>
                        </div>
                         <div className="flex justify-between font-bold">
                            <span>Your Guaranteed Fund</span>
                            <span>Rs. {userData.guaranteedFund.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
              </div>
          </div>
          

          <div>
            {totalShortfall > 0 ? (
                 <Alert variant="default" className="bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertTitle>Automatic Fund Top-Up</AlertTitle>
                    <AlertDescription>
                        You have a total fund shortfall of <strong>Rs. {totalShortfall.toLocaleString()}</strong>.
                        This amount will be added to your total loan, and your Share and Guaranteed funds will be topped up automatically upon approval. Your final loan amount will be <strong>Rs. {(loanAmount + totalShortfall).toLocaleString()}</strong>.
                    </AlertDescription>
                </Alert>
            ) : (
                <Alert variant="default" className="bg-green-600/10 border-green-600/30 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle>Ready to Apply!</AlertTitle>
                    <AlertDescription>
                        Your current fund balances meet the requirements for this loan amount.
                    </AlertDescription>
                </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="ghost" type="reset">Cancel</Button>
          <SubmitButton disabled={isLoading} />
        </CardFooter>
        </form>
      </Card>
    </div>
  );
}

