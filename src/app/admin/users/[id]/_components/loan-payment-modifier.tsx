"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Edit2 } from "lucide-react";
import { updateLoanDetails } from "../actions";
import { useToast } from "@/hooks/use-toast";

const initialState = {
  error: undefined,
  success: false,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save Changes
        </Button>
    )
}

export function LoanDetailsModifier({ 
    loanId, 
    loanAmount,
    principal,
    monthlyPrincipalPayment 
}: {
    loanId: string;
    loanAmount: number;
    principal: number;
    monthlyPrincipalPayment: number;
}) {
  const [state, formAction] = useActionState(updateLoanDetails, initialState);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: state.error,
      });
    } else if (state?.success) {
      toast({
        title: "Loan Updated",
        description: "The loan details have been successfully updated.",
      });
      setOpen(false);
    }
  }, [state, toast]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="size-8">
          <Edit2 className="size-4" />
          <span className="sr-only">Edit Loan Details</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modify Loan Details</DialogTitle>
          <DialogDescription>
            Change the loan amount, outstanding principal, or monthly deduction payment directly. Use this to fix errors or adjustments.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4 py-4">
          <input type="hidden" name="loanId" value={loanId} />
          
          <div className="grid gap-2">
            <Label htmlFor="loanAmount">Original Loan Amount (₹)</Label>
            <Input
              id="loanAmount"
              name="loanAmount"
              type="number"
              defaultValue={loanAmount}
              min="0"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="principal">Outstanding Principal (₹)</Label>
            <Input
              id="principal"
              name="principal"
              type="number"
              defaultValue={principal}
              min="0"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="monthlyPrincipalPayment">Monthly Payment Amount (₹)</Label>
            <Input
              id="monthlyPrincipalPayment"
              name="monthlyPrincipalPayment"
              type="number"
              defaultValue={monthlyPrincipalPayment}
              min="0"
              required
            />
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
