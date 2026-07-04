"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Edit2, DollarSign } from "lucide-react";
import { updateLoanMonthlyPayment } from "../actions";
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

export function LoanPaymentModifier({ loanId, monthlyPrincipalPayment, maxLimit }: {
    loanId: string;
    monthlyPrincipalPayment: number;
    maxLimit: number;
}) {
  const [state, formAction] = useActionState(updateLoanMonthlyPayment, initialState);
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
        title: "Payment Updated",
        description: "The monthly principal payment has been successfully updated.",
      });
      setOpen(false);
    }
  }, [state, toast]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="size-8">
          <Edit2 className="size-4" />
          <span className="sr-only">Edit Monthly Payment</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modify Monthly Payment</DialogTitle>
          <DialogDescription>
            Change the monthly principal deduction amount directly. This is useful for resolving errors or missed payments.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4 py-4">
          <input type="hidden" name="loanId" value={loanId} />
          
          <div className="grid gap-2">
            <Label htmlFor="monthlyPrincipalPayment" className="flex items-center gap-2">
              <DollarSign className="size-4 text-primary" /> Monthly Payment Amount (₹)
            </Label>
            <Input
              id="monthlyPrincipalPayment"
              name="monthlyPrincipalPayment"
              type="number"
              defaultValue={monthlyPrincipalPayment}
              min="0"
              max={maxLimit}
              step="1"
              required
            />
            <p className="text-[11px] text-muted-foreground">
              Maximum allowed: ₹{maxLimit.toLocaleString()} (remaining loan principal)
            </p>
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
