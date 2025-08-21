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
import { calculateMonthlyPayment } from "@/lib/calculations";
import { CalculatorIcon, RefreshCw } from "lucide-react";

export default function LoanCalculatorPage() {
  const [loanAmount, setLoanAmount] = useState(10000);
  const [interestRate, setInterestRate] = useState(5);
  const [loanDuration, setLoanDuration] = useState(5);
  const [monthlyPayment, setMonthlyPayment] = useState<number | null>(null);

  const handleCalculation = () => {
    const payment = calculateMonthlyPayment(
      loanAmount,
      interestRate,
      loanDuration
    );
    setMonthlyPayment(payment);
  };
  
  const handleReset = () => {
    setLoanAmount(10000);
    setInterestRate(5);
    setLoanDuration(5);
    setMonthlyPayment(null);
  };

  return (
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <CalculatorIcon className="size-6" />
            Loan Payment Calculator
          </CardTitle>
          <CardDescription>
            Estimate your monthly payments based on loan terms.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="loan-amount">Loan Amount</Label>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">$</span>
              <Input
                id="loan-amount"
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="flex-1"
              />
            </div>
            <Slider
              value={[loanAmount]}
              onValueChange={(value) => setLoanAmount(value[0])}
              min={1000}
              max={100000}
              step={500}
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
            <Label htmlFor="loan-duration">Loan Duration (Years)</Label>
            <div className="flex items-center gap-4">
              <Input
                id="loan-duration"
                type="number"
                value={loanDuration}
                onChange={(e) => setLoanDuration(Number(e.target.value))}
                className="w-24"
              />
               <span className="text-muted-foreground">Years</span>
              <Slider
                value={[loanDuration]}
                onValueChange={(value) => setLoanDuration(value[0])}
                min={1}
                max={30}
                step={1}
              />
            </div>
          </div>
          {monthlyPayment !== null && (
            <div className="bg-accent/20 border-l-4 border-accent text-accent-foreground p-4 rounded-md">
              <p className="font-medium">Estimated Monthly Payment:</p>
              <p className="text-3xl font-bold font-headline">
                ${monthlyPayment.toFixed(2)}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleReset}>
            <RefreshCw className="mr-2" />
            Reset
          </Button>
          <Button onClick={handleCalculation}>Calculate Payment</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
