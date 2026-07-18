
"use client";

export const dynamic = 'force-dynamic';

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

const initialState: { error: string | null } = {
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
  const nowObj = new Date();
  const [loanAmount, setLoanAmount] = useState(100000);
  const [monthlyPrincipal, setMonthlyPrincipal] = useState(2000);
  const [startMonth, setStartMonth] = useState(nowObj.getMonth());
  const [startYear, setStartYear] = useState(nowObj.getFullYear());
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allowExceeding, setAllowExceeding] = useState(false);

  const { toast } = useToast();
  const [state, formAction] = useActionState(applyForLoan, initialState);

  useEffect(() => {
    async function fetchUserData() {
      setIsLoading(true);
      try {
        const data = await getUserFundsAndSettings();
        setUserData(data);
        const maxLoan = data.bankSettings.maxLoanAmount - data.activeLoanPrincipal;
        const initialLoanAmount = data.role === 'admin' 
            ? 100000 
            : Math.min(100000, maxLoan > 10000 ? maxLoan : 10000);
        setLoanAmount(initialLoanAmount);
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

  if (userData.role !== 'member' && userData.role !== 'board_member' && userData.role !== 'admin') {
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

  const totalTargetAmount = userData.activeLoanPrincipal + loanAmount;
  const requiredShare = totalTargetAmount * 0.05;
  const requiredGuaranteed = totalTargetAmount * 0.05;
  
  const shareFundShortfall = Math.max(0, requiredShare - userData.shareFund);
  const guaranteedFundShortfall = Math.max(0, requiredGuaranteed - userData.guaranteedFund);
  const totalShortfall = shareFundShortfall + guaranteedFundShortfall;
  
  const totalProposedLoanDebt = userData.activeLoanPrincipal + loanAmount;
  const isExceedingLimit = totalProposedLoanDebt > userData.bankSettings.maxLoanAmount;
  
  const minMonthlyPayment = Math.ceil(loanAmount / userData.bankSettings.maxLoanTenureMonths);
  
   if (maxLoanForUser < 10000 && userData.role !== 'admin') {
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
        <input type="hidden" name="allowExceeding" value={allowExceeding ? "true" : "false"} />
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
            <input type="hidden" name="startMonth" value={startMonth} />
            <input type="hidden" name="startYear" value={startYear} />
            
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

                  <div className="grid gap-2">
                    <Label htmlFor="start-month">Starting Deduction Month</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <select
                        id="start-month"
                        value={startMonth}
                        onChange={(e) => setStartMonth(Number(e.target.value))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
                      >
                        {Array.from({ length: 12 }).map((_, idx) => (
                          <option key={idx} value={idx}>
                            {new Date(2000, idx, 1).toLocaleString('default', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                      
                      <select
                        id="start-year"
                        value={startYear}
                        onChange={(e) => setStartYear(Number(e.target.value))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
                      >
                        {Array.from({ length: 3 }).map((_, idx) => {
                          const yr = nowObj.getFullYear() + idx;
                          return (
                            <option key={yr} value={yr}>
                              {yr}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Calculations & deductions for principal and interest will begin starting this month.
                    </p>
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
          

          <div className="space-y-4">
            {isExceedingLimit && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Maximum Loan Limit Exceeded</AlertTitle>
                    <AlertDescription>
                        The requested loan of <strong>₹{loanAmount.toLocaleString()}</strong> would bring your total outstanding loan balance to <strong>₹{totalProposedLoanDebt.toLocaleString()}</strong>. This exceeds the maximum bank limit of <strong>₹{userData.bankSettings.maxLoanAmount.toLocaleString()}</strong>. Please reduce your requested amount.
                    </AlertDescription>
                </Alert>
            )}

            {isExceedingLimit && userData.role === 'admin' && (
                <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <input
                        type="checkbox"
                        id="allow-exceeding-limit"
                        checked={allowExceeding}
                        onChange={(e) => setAllowExceeding(e.target.checked)}
                        className="rounded border-input text-primary focus:ring-ring cursor-pointer"
                    />
                    <label htmlFor="allow-exceeding-limit" className="text-sm font-medium text-destructive cursor-pointer">
                        Allow exceeding maximum loan limit (Administrator override)
                    </label>
                </div>
            )}
            
            {!isExceedingLimit && totalShortfall > 0 && (
                 <Alert variant="default" className="bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertTitle>Recommended Fund Top-Up</AlertTitle>
                    <AlertDescription>
                        Your current funds have a total shortfall of <strong>₹{totalShortfall.toLocaleString()}</strong>.
                        This shortfall does not prevent application. The administrator will review and can top up your Share and Guaranteed funds by adding it to your loan principal during approval.
                    </AlertDescription>
                </Alert>
            )}
            
            {!isExceedingLimit && totalShortfall === 0 && (
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
          <Button variant="ghost" type="reset" onClick={() => setAllowExceeding(false)}>Cancel</Button>
          <SubmitButton disabled={isLoading || (isExceedingLimit && !(userData.role === 'admin' && allowExceeding))} />
        </CardFooter>
        </form>
      </Card>
    </div>
  );
}
