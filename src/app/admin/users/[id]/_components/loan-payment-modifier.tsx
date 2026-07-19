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
    monthlyPrincipalPayment,
    startMonth,
    startYear
}: {
    loanId: string;
    loanAmount: number;
    principal: number;
    monthlyPrincipalPayment: number;
    startMonth?: number;
    startYear?: number;
}) {
  const [state, formAction] = useActionState(updateLoanDetails, initialState);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    startMonth !== undefined ? startMonth.toString() : now.getMonth().toString()
  );
  const [selectedYear, setSelectedYear] = useState(
    startYear !== undefined ? startYear.toString() : now.getFullYear().toString()
  );

  // Sync state when props change or dialog opens
  useEffect(() => {
    if (open) {
      setSelectedMonth(startMonth !== undefined ? startMonth.toString() : now.getMonth().toString());
      setSelectedYear(startYear !== undefined ? startYear.toString() : now.getFullYear().toString());
    }
  }, [open, startMonth, startYear]);

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
            Change the loan amount, outstanding principal, monthly payment, or starting time directly.
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

          <div className="grid gap-2">
            <Label htmlFor="startMonth">Starting Deduction Time</Label>
            <div className="grid grid-cols-2 gap-4">
              <select
                id="startMonth"
                name="startMonth"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer text-foreground"
              >
                {Array.from({ length: 12 }).map((_, idx) => (
                  <option key={idx} value={idx}>
                    {new Date(2000, idx, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>

              <select
                id="startYear"
                name="startYear"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer text-foreground"
              >
                {Array.from({ length: 11 }).map((_, idx) => {
                  const yr = now.getFullYear() - 5 + idx;
                  return (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  );
                })}
              </select>
            </div>
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
