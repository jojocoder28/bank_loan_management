
"use client";

import { useActionState, useFormStatus } from "react-dom";
import { useState, useEffect } from "react";
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

function SubmitButton({ canApply }: { canApply: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={!canApply || pending}>
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
  const [userData, setUserData] = useState({ shareFund: 0, guaranteedFund: 0, membershipStatus: 'provisional' });
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

  if (userData.membershipStatus !== 'active') {
    return (
      <div className="flex justify-center items-start pt-8">
        <Card className="w-full max-w-lg text-center">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-center"><ShieldCheck className="size-8 text-primary"/> Become a Member</CardTitle>
                <CardDescription>You must be an active member to apply for a loan.</CardDescription>
            </CardHeader>
            <CardContent>
                {userData.membershipStatus === 'provisional' && <p>Your membership has not been activated yet. Please apply to become a member.</p>}
                {userData.membershipStatus === 'pending' && <p>Your membership application is pending approval. You will be able to apply for a loan once it is approved.</p>}
            </CardContent>
            <CardFooter>
                 {userData.membershipStatus === 'provisional' && (
                    <Button asChild className="w-full">
                        <Link href="/become-member">Apply for Membership <ArrowRight className="ml-2" /></Link>
                    </Button>
                )}
            </CardFooter>
        </Card>
      </div>
    )
  }

  const { requiredShare, requiredGuaranteed } = calculateRequiredFunds(loanAmount);
  
  const shareFundShortfall = Math.max(0, requiredShare - userData.shareFund);
  const guaranteedFundShortfall = Math.max(0, requiredGuaranteed - userData.guaranteedFund);
  const totalShortfall = shareFundShortfall + guaranteedFundShortfall;
  const canApply = totalShortfall === 0 && !isLoading;

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
              <div className="grid gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="loan-amount">Loan Amount (Rs.)</Label>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground text-lg">Rs.</span>
                      <Input
                        id="loan-amount"
                        type="number"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(Number(e.target.value))}
                        className="flex-1 text-lg font-bold"
                        step={1000}
                      />
                    </div>
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
                     <Slider
                      id="monthly-principal"
                      value={[monthlyPrincipal]}
                      onValueChange={(value) => setMonthlyPrincipal(value[0])}
                      min={1000}
                      max={10000}
                      step={500}
                    />
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground text-lg">Rs.</span>
                      <Input
                        type="number"
                        value={monthlyPrincipal}
                        onChange={(e) => setMonthlyPrincipal(Number(e.target.value))}
                        className="flex-1 text-lg font-bold"
                        step={500}
                      />
                    </div>
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
            {canApply ? (
                 <Alert variant="default" className="bg-green-600/10 border-green-600/30 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle>Ready to Apply!</AlertTitle>
                    <AlertDescription>
                        Your current fund balances meet the requirements for this loan amount.
                    </AlertDescription>
                </Alert>
            ) : (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Fund Shortfall</AlertTitle>
                    <AlertDescription>
                        You cannot apply for this loan amount. You need to increase your funds.
                        <ul className="list-disc pl-5 mt-2">
                            {shareFundShortfall > 0 && <li>Share Fund shortfall: Rs. {shareFundShortfall.toLocaleString()}</li>}
                            {guaranteedFundShortfall > 0 && <li>Guaranteed Fund shortfall: Rs. {guaranteedFundShortfall.toLocaleString()}</li>}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="ghost" type="reset">Cancel</Button>
          <SubmitButton canApply={canApply} />
        </CardFooter>
        </form>
      </Card>
    </div>
  );
}
