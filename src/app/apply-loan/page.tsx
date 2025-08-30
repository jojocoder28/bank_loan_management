
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { calculateRequiredFunds } from "@/lib/coop-calculations";
import { Handshake, Info, AlertTriangle, CheckCircle2, Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import { applyForLoan } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { getUserFundsAndSettings } from "./data-actions";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { numberToWords } from "@/lib/number-to-words";
import { IBank } from "@/models/bank";
import { UserRole } from "@/models/user";

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

interface UserData {
    shareFund: number;
    guaranteedFund: number;
    role: UserRole;
    bankSettings: IBank;
    activeLoanPrincipal: number;
}

export default function ApplyLoanPage() {
  const [loanAmount, setLoanAmount] = useState(100000);
  const [monthlyPrincipal, setMonthlyPrincipal] = useState(2000);
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();
  const [state, formAction] = useActionState(applyForLoan, initialState);

  useEffect(() => {
    async function fetchUserData() {
      setIsLoading(true);
      try {
        const data = await getUserFundsAndSettings();
        setUserData(data);
        const maxLoan = data.bankSettings.maxLoanAmount - data.activeLoanPrincipal;
        const initialLoanAmount = Math.min(100000, maxLoan > 10000 ? maxLoan : 10000);
        setLoanAmount(initialLoanAmount)
        const newMin = Math.ceil(initialLoanAmount / data.bankSettings.maxLoanTenureMonths);
        setMonthlyPrincipal(newMin);
      } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Failed to load page',
            description: (error as Error).message
        })
      } finally {
        setIsLoading(false);
      }
    }
    fetchUserData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    if (userData) {
      const newMin = Math.ceil(loanAmount / userData.bankSettings.maxLoanTenureMonths);
      setMonthlyPrincipal(prev => Math.max(prev, newMin));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanAmount, userData]);

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
  
  if (!userData) {
      return (
          <div className="flex justify-center items-start pt-8">
              <Card className="w-full max-w-lg text-center">
                   <CardHeader>
                      <CardTitle className="flex items-center gap-2 justify-center"><AlertTriangle className="size-8 text-destructive"/> Error</CardTitle>
                      <CardDescription>Could not load necessary user and bank data.</CardDescription>
                  </CardHeader>
              </Card>
          </div>
      )
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
  
  const maxLoanForUser = userData.bankSettings.maxLoanAmount - userData.activeLoanPrincipal;

  const { requiredShare, requiredGuaranteed } = calculateRequiredFunds(loanAmount);
  
  const shareFundShortfall = Math.max(0, requiredShare - userData.shareFund);
  const guaranteedFundShortfall = Math.max(0, requiredGuaranteed - userData.guaranteedFund);
  const totalShortfall = shareFundShortfall + guaranteedFundShortfall;
  
  const minMonthlyPayment = Math.ceil(loanAmount / userData.bankSettings.maxLoanTenureMonths);
  
   if (maxLoanForUser < 10000) {
      return (
         <div className="flex justify-center items-start pt-8">
            <Card className="w-full max-w-lg text-center">
               <CardHeader>
                  <CardTitle className="flex items-center gap-2 justify-center">
                     <Info className="size-8 text-primary" />
                     Loan Limit Reached
                  </CardTitle>
                  <CardDescription>
                     You have reached your maximum loan limit of ₹{userData.bankSettings.maxLoanAmount.toLocaleString()}.
                  </CardDescription>
               </CardHeader>
               <CardContent>
                  <p>
                     Your outstanding loan principal is ₹{userData.activeLoanPrincipal.toLocaleString()}. Please pay down your existing loan to become eligible for new loans.
                  </p>
               </CardContent>
                <CardFooter>
                    <Button asChild className="w-full">
                        <Link href="/my-finances">View My Finances <ArrowRight className="ml-2" /></Link>
                    </Button>
                </CardFooter>
            </Card>
         </div>
      );
   }


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
                    <Label htmlFor="loan-amount">Loan Amount (₹) - Max Available: {maxLoanForUser.toLocaleString()}</Label>
                     <Input
                        id="loan-amount"
                        type="number"
                        value={loanAmount}
                        onChange={(e) => {
                            const newValue = Number(e.target.value);
                            setLoanAmount(newValue > maxLoanForUser ? maxLoanForUser : newValue);
                        }}
                        className="text-lg font-bold"
                        step={1000}
                        min={10000}
                        max={maxLoanForUser}
                    />
                    <div className="text-sm text-muted-foreground capitalize bg-secondary/30 p-2 rounded-md border text-center">
                        {numberToWords(loanAmount)} Rupees Only
                    </div>
                    <Slider
                      value={[loanAmount]}
                      onValueChange={(value) => setLoanAmount(value[0])}
                      min={10000}
                      max={maxLoanForUser}
                      step={1000}
                    />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="monthly-principal">Your Chosen Monthly Principal Payment (₹)</Label>
                    <Input
                        type="number"
                        id="monthly-principal"
                        value={monthlyPrincipal}
                        onChange={(e) => setMonthlyPrincipal(Number(e.target.value))}
                        className="text-lg font-bold"
                        step={1}
                        min={minMonthlyPayment}
                    />
                     <div className="text-sm text-muted-foreground capitalize bg-secondary/30 p-2 rounded-md border text-center">
                        {numberToWords(monthlyPrincipal)} Rupees Only
                    </div>
                    <Slider
                      value={[monthlyPrincipal]}
                      onValueChange={(value) => setMonthlyPrincipal(value[0])}
                      min={minMonthlyPayment}
                      max={Math.max(minMonthlyPayment, loanAmount)}
                      step={1}
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
                            <span className="font-medium">₹{requiredShare.toLocaleString()}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Required Guaranteed Fund</span>
                            <span className="font-medium">₹{requiredGuaranteed.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t pt-2 mt-1">
                            <span>Your Share Fund</span>
                            <span>₹{userData.shareFund.toLocaleString()}</span>
                        </div>
                         <div className="flex justify-between font-bold">
                            <span>Your Guaranteed Fund</span>
                            <span>₹{userData.guaranteedFund.toLocaleString()}</span>
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
                        You have a total fund shortfall of <strong>₹{totalShortfall.toLocaleString()}</strong>.
                        This amount will be added to your total loan, and your Share and Guaranteed funds will be topped up automatically upon approval. Your final loan amount will be <strong>₹{(loanAmount + totalShortfall).toLocaleString()}</strong>.
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
