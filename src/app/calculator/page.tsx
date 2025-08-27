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
import { calculateLoanTenure } from "@/lib/calculations";
import { CalculatorIcon, RefreshCw, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LoanCalculatorPage() {
  const [loanAmount, setLoanAmount] = useState(100000);
  const [interestRate, setInterestRate] = useState(10);
  const [monthlyPayment, setMonthlyPayment] = useState(2000);
  const [loanTenure, setLoanTenure] = useState<number | null>(null);

  const handleCalculation = () => {
    const tenure = calculateLoanTenure(
      loanAmount,
      interestRate,
      monthlyPayment
    );
    setLoanTenure(tenure);
  };
  
  const handleReset = () => {
    setLoanAmount(100000);
    setInterestRate(10);
    setMonthlyPayment(2000);
    setLoanTenure(null);
  };
  
  const isPaymentTooLow = loanTenure === Infinity;

  return (
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <CalculatorIcon className="size-6" />
            Loan Tenure Calculator
          </CardTitle>
          <CardDescription>
            Estimate how long it will take to repay your loan based on your monthly payment.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="loan-amount">Loan Amount</Label>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">₹</span>
              <Input
                id="loan-amount"
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="flex-1"
                step={1000}
              />
            </div>
            <Slider
              value={[loanAmount]}
              onValueChange={(value) => setLoanAmount(value[0])}
              min={1000}
              max={500000}
              step={1000}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="interest-rate">Annual Interest Rate (%)</Label>
            <div className="flex items-center gap-4">
              <Input
                id="interest-rate"
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-muted-foreground">%</span>
              <Slider
                value={[interestRate]}
                onValueChange={(value) => setInterestRate(value[0])}
                min={1}
                max={20}
                step={0.25}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="monthly-payment">Desired Monthly Payment</Label>
             <div className="flex items-center gap-4">
               <span className="text-muted-foreground">₹</span>
              <Input
                id="monthly-payment"
                type="number"
                value={monthlyPayment}
                onChange={(e) => setMonthlyPayment(Number(e.target.value))}
                className="flex-1"
                step={100}
              />
            </div>
             <Slider
                value={[monthlyPayment]}
                onValueChange={(value) => setMonthlyPayment(value[0])}
                min={500}
                max={25000}
                step={100}
              />
          </div>
          {loanTenure !== null && (
             isPaymentTooLow ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Payment Too Low</AlertTitle>
                  <AlertDescription>
                    The monthly payment is too low to cover the interest. The loan will never be fully paid off with this amount. Please increase the monthly payment.
                  </AlertDescription>
                </Alert>
             ) : (
                <div className="bg-accent/20 border-l-4 border-accent text-accent-foreground p-4 rounded-md">
                  <p className="font-medium">Estimated Loan Tenure:</p>
                  <p className="text-3xl font-bold font-headline">
                    {loanTenure} months
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Approximately {(loanTenure / 12).toFixed(1)} years
                  </p>
                </div>
             )
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleReset}>
            <RefreshCw className="mr-2" />
            Reset
          </Button>
          <Button onClick={handleCalculation}>Calculate Tenure</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
