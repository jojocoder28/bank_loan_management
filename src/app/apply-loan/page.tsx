
"use client";

import { useState } from "react";
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
import { calculateRequiredFunds, calculateMonthlyInterest } from "@/lib/coop-calculations";
import { Handshake, Info, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

// Mock user's current fund balances
const currentUserFunds = {
  shareFund: 7500,
  guaranteedFund: 6000,
};

export default function ApplyLoanPage() {
  const [loanAmount, setLoanAmount] = useState(100000);
  const [monthlyPrincipal, setMonthlyPrincipal] = useState(2000);
  
  const { requiredShare, requiredGuaranteed } = calculateRequiredFunds(loanAmount);
  const monthlyInterest = calculateMonthlyInterest(loanAmount, 10); // 10% monthly interest rate

  const shareFundShortfall = Math.max(0, requiredShare - currentUserFunds.shareFund);
  const guaranteedFundShortfall = Math.max(0, requiredGuaranteed - currentUserFunds.guaranteedFund);
  const totalShortfall = shareFundShortfall + guaranteedFundShortfall;
  const canApply = totalShortfall === 0;

  return (
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Handshake className="size-6" />
            Apply for a New Loan
          </CardTitle>
          <CardDescription>
            Enter your desired loan amount and see the requirements.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8">
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

          <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-secondary/30">
                  <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2"><Info className="size-5 text-primary"/>Loan Requirements</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 text-sm">
                      <div className="flex justify-between">
                          <span className="text-muted-foreground">Required Share Fund (5%)</span>
                          <span className="font-medium">Rs. {requiredShare.toLocaleString()}</span>
                      </div>
                       <div className="flex justify-between">
                          <span className="text-muted-foreground">Required Guaranteed Fund (5%)</span>
                          <span className="font-medium">Rs. {requiredGuaranteed.toLocaleString()}</span>
                      </div>
                       <div className="flex justify-between border-t pt-3 mt-2">
                          <span className="text-muted-foreground font-bold">Total Collateral Required</span>
                          <span className="font-bold">Rs. {(requiredShare + requiredGuaranteed).toLocaleString()}</span>
                      </div>
                  </CardContent>
              </Card>
              <Card className="bg-secondary/30">
                  <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="size-5 text-primary"/>Your Estimated Payments</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 text-sm">
                      <div className="flex justify-between">
                          <span className="text-muted-foreground">Monthly Interest (10%)</span>
                          <span className="font-medium">Rs. {monthlyInterest.toLocaleString()}</span>
                      </div>
                       <div className="flex justify-between">
                          <span className="text-muted-foreground">Your Chosen Principal</span>
                          <span className="font-medium">Rs. {monthlyPrincipal.toLocaleString()}</span>
                      </div>
                       <div className="flex justify-between border-t pt-3 mt-2">
                          <span className="text-muted-foreground font-bold">Total Est. Monthly Payment</span>
                          <span className="font-bold">Rs. {(monthlyInterest + monthlyPrincipal).toLocaleString()}</span>
                      </div>
                  </CardContent>
              </Card>
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
                        To get this loan, the bank will charge an additional Rs. {totalShortfall.toLocaleString()} to meet the fund requirements.
                        <ul className="list-disc pl-5 mt-2">
                            {shareFundShortfall > 0 && <li>Share Fund shortfall: Rs. {shareFundShortfall.toLocaleString()}</li>}
                            {guaranteedFundShortfall > 0 && <li>Guaranteed Fund shortfall: Rs. {guaranteedFundShortfall.toLocaleString()}</li>}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}
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
            <p className="text-xs text-muted-foreground mt-1">You can change this amount any month. Interest is calculated separately on the outstanding principal.</p>
          </div>

        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="ghost">Cancel</Button>
          <Button disabled={!canApply}>Submit Loan Application</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

