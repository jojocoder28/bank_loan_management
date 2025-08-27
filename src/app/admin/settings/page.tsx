
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
import { getBankSettings, updateBankSettings } from "./actions";
import { Loader2, Save, Settings as SettingsIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { IBank } from "@/models/bank";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const initialFormState = {
  error: null,
  success: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 animate-spin" />
          Saving...
        </>
      ) : (
         <>
          <Save className="mr-2" />
          Save Settings
         </>
      )}
    </Button>
  );
}

export default function AdminSettingsPage() {
  const [formState, formAction] = useActionState(updateBankSettings, initialFormState);
  const [settings, setSettings] = useState<IBank | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      const fetchedSettings = await getBankSettings();
      setSettings(fetchedSettings);
      setLoading(false);
    }
    loadSettings();
  }, []);
  
  useEffect(() => {
    if (formState?.error) {
      const errorMsg = typeof formState.error === 'object' 
        ? Object.values(formState.error).flat().join(', ')
        : formState.error;
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: errorMsg,
      });
    }
     if (formState?.success) {
      toast({
        title: "Success",
        description: formState.success,
      });
    }
  }, [formState, toast]);

  if (loading) {
    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="grid gap-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="grid gap-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="grid gap-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
            <CardFooter>
                 <Skeleton className="h-10 w-32" />
            </CardFooter>
        </Card>
    );
  }


  return (
    <form action={formAction}>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon />
            Bank Settings
          </CardTitle>
          <CardDescription>
            Manage the bank's core financial parameters. These values affect all users.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
              <Label htmlFor="loanInterestRate">Loan Interest Rate (%)</Label>
              <Input 
                id="loanInterestRate" 
                name="loanInterestRate" 
                type="number"
                defaultValue={settings?.loanInterestRate ?? 10}
                step="0.1"
                required 
               />
              <p className="text-xs text-muted-foreground">The annual interest rate charged on all active loans.</p>
               {formState.error?.loanInterestRate && <p className="text-sm text-destructive">{formState.error.loanInterestRate[0]}</p>}
          </div>
          <div className="grid gap-2">
              <Label htmlFor="thriftFundInterestRate">Thrift Fund Interest Rate (%)</Label>
              <Input 
                id="thriftFundInterestRate" 
                name="thriftFundInterestRate" 
                type="number" 
                defaultValue={settings?.thriftFundInterestRate ?? 6}
                step="0.1"
                required 
              />
               <p className="text-xs text-muted-foreground">The annual interest rate paid to members for their thrift fund balance.</p>
              {formState.error?.thriftFundInterestRate && <p className="text-sm text-destructive">{formState.error.thriftFundInterestRate[0]}</p>}
          </div>
          <div className="grid gap-2">
              <Label htmlFor="shareFundDividendRate">Share Fund Dividend Rate (%)</Label>
              <Input 
                id="shareFundDividendRate" 
                name="shareFundDividendRate" 
                type="number" 
                defaultValue={settings?.shareFundDividendRate ?? 12}
                step="0.1"
                required 
              />
               <p className="text-xs text-muted-foreground">The annual dividend percentage paid to members on their share fund balance.</p>
              {formState.error?.shareFundDividendRate && <p className="text-sm text-destructive">{formState.error.shareFundDividendRate[0]}</p>}
          </div>
          <Separator />
           <div className="grid gap-2">
              <Label htmlFor="maxLoanAmount">Maximum Loan Amount (₹)</Label>
              <Input 
                id="maxLoanAmount" 
                name="maxLoanAmount" 
                type="number" 
                defaultValue={settings?.maxLoanAmount ?? 600000}
                step="10000"
                required 
              />
               <p className="text-xs text-muted-foreground">The maximum total loan amount a member can have at any one time.</p>
              {formState.error?.maxLoanAmount && <p className="text-sm text-destructive">{formState.error.maxLoanAmount[0]}</p>}
          </div>
           <div className="grid gap-2">
              <Label htmlFor="maxLoanTenureMonths">Maximum Loan Tenure (Months)</Label>
              <Input 
                id="maxLoanTenureMonths" 
                name="maxLoanTenureMonths" 
                type="number" 
                defaultValue={settings?.maxLoanTenureMonths ?? 60}
                step="1"
                required 
              />
               <p className="text-xs text-muted-foreground">The longest duration a loan can be paid back over. Affects minimum payment calculations.</p>
              {formState.error?.maxLoanTenureMonths && <p className="text-sm text-destructive">{formState.error.maxLoanTenureMonths[0]}</p>}
          </div>
          <Separator />
          <div className="grid gap-2">
              <Label htmlFor="initialShareFundDeposit">Initial Share Fund Deposit (₹)</Label>
              <Input 
                id="initialShareFundDeposit" 
                name="initialShareFundDeposit" 
                type="number" 
                defaultValue={settings?.initialShareFundDeposit ?? 5000}
                step="100"
                required 
              />
               <p className="text-xs text-muted-foreground">The one-time deposit required for a new user to become a member.</p>
              {formState.error?.initialShareFundDeposit && <p className="text-sm text-destructive">{formState.error.initialShareFundDeposit[0]}</p>}
          </div>
           <div className="grid gap-2">
              <Label htmlFor="monthlyThriftContribution">Monthly Thrift Contribution (₹)</Label>
              <Input 
                id="monthlyThriftContribution" 
                name="monthlyThriftContribution" 
                type="number" 
                defaultValue={settings?.monthlyThriftContribution ?? 1000}
                step="50"
                required 
              />
               <p className="text-xs text-muted-foreground">The recurring monthly contribution required from all active members.</p>
              {formState.error?.monthlyThriftContribution && <p className="text-sm text-destructive">{formState.error.monthlyThriftContribution[0]}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
            <SubmitButton />
        </CardFooter>
      </Card>
    </form>
  );
}
