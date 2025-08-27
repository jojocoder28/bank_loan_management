
"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateMonthlyPayment } from "../actions";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ILoan } from "@/models/loan";

const initialState = {
  error: null,
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending}>
      {pending ? (
        <Loader2 className="mr-2 animate-spin" />
      ) : (
        <Save className="mr-2" />
      )}
      Save
    </Button>
  );
}

export function UpdatePaymentForm({ loan }: { loan: ILoan }) {
  const [state, formAction] = useActionState(updateMonthlyPayment, initialState);
  const [amount, setAmount] = useState(loan.monthlyPrincipalPayment ?? 0);
  const { toast } = useToast();

  useEffect(() => {
    if (state.error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: state.error,
      });
    }
    if (state.success) {
      toast({
        title: "Success!",
        description: "Your monthly payment amount has been updated.",
      });
    }
  }, [state, toast]);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="loanId" value={loan._id.toString()} />
      <Input
        type="number"
        name="newMonthlyPayment"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="w-32 h-9"
        min="0"
        step="100"
      />
      <SubmitButton />
    </form>
  );
}
