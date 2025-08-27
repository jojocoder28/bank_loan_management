
"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestLoanIncrease } from "../actions";
import { Loader2, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ILoan } from "@/models/loan";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { calculateRequiredFunds } from "@/lib/coop-calculations";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const initialState = {
  error: null,
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <Loader2 className="mr-2 animate-spin" />
      ) : (
        <TrendingUp className="mr-2" />
      )}
      Request Increase
    </Button>
  );
}

export function IncreaseLoanForm({ loan }: { loan: ILoan }) {
  const [state, formAction] = useActionState(requestLoanIncrease, initialState);
  const [amount, setAmount] = useState(10000);
  const { toast } = useToast();

  useEffect(() => {
    if (state.error) {
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: state.error,
      });
    }
    if (state.success) {
      toast({
        title: "Request Submitted!",
        description: "Your request to increase the loan amount has been submitted for admin approval.",
      });
    }
  }, [state, toast]);

  const { requiredShare, requiredGuaranteed } = calculateRequiredFunds(amount);
  const totalRequired = requiredShare + requiredGuaranteed;

  return (
    <Card className="flex flex-col">
        <form action={formAction}>
        <CardHeader>
            <CardTitle className="text-xl">Increase Loan Amount</CardTitle>
            <CardDescription>Request to add more funds to your existing loan principal.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
            <input type="hidden" name="loanId" value={loan._id.toString()} />
            <div className="space-y-2">
                 <Label htmlFor="increase-amount">Amount to Increase By</Label>
                 <Input
                    id="increase-amount"
                    type="number"
                    name="increaseAmount"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    min="1000"
                    step="1000"
                />
            </div>
             <Alert variant="default" className="text-xs">
                <Info className="size-4" />
                <AlertDescription>
                   This will require an additional <strong>₹{totalRequired.toLocaleString()}</strong> in your Share and Guaranteed funds, which will be topped up from the new loan amount upon approval.
                </AlertDescription>
            </Alert>
        </CardContent>
        <CardFooter>
            <SubmitButton />
        </CardFooter>
        </form>
    </Card>
  );
}
