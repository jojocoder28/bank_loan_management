"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { applyLoanOnBehalf } from "../../actions";

interface ApplyLoanButtonProps {
  userId: string;
}

export function ApplyLoanButton({ userId }: ApplyLoanButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const now = new Date();
  const [loanAmount, setLoanAmount] = useState("");
  const [monthlyPrincipal, setMonthlyPrincipal] = useState("");
  const [startMonth, setStartMonth] = useState(now.getMonth().toString());
  const [startYear, setStartYear] = useState(now.getFullYear().toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(loanAmount);
    const principal = Number(monthlyPrincipal);

    if (isNaN(amount) || amount < 10000) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Minimum loan amount is ₹10,000.",
      });
      return;
    }

    if (isNaN(principal) || principal <= 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Monthly principal payment must be positive.",
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await applyLoanOnBehalf(userId, amount, principal, Number(startMonth), Number(startYear));
        if (result.error) {
          toast({
            variant: "destructive",
            title: "Application Failed",
            description: result.error,
          });
        } else if (result.success) {
          toast({
            title: "Loan Applied Successfully",
            description: "A new pending loan application has been created for this member.",
          });
          setOpen(false);
          setLoanAmount("");
          setMonthlyPrincipal("");
          router.refresh();
        }
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: err.message || "An unexpected error occurred.",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="size-4" /> Apply for Loan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Apply for Loan on Behalf</DialogTitle>
            <DialogDescription>
              Enter the loan details below to create a new pending loan application for this member.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Loan Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="e.g. 50000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                required
                disabled={isPending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="principal">Monthly Principal Payment (₹)</Label>
              <Input
                id="principal"
                type="number"
                placeholder="e.g. 2000"
                value={monthlyPrincipal}
                onChange={(e) => setMonthlyPrincipal(e.target.value)}
                required
                disabled={isPending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-start-month">Starting Deduction Month</Label>
              <div className="grid grid-cols-2 gap-4">
                <select
                  id="admin-start-month"
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
                  disabled={isPending}
                >
                  {Array.from({ length: 12 }).map((_, idx) => (
                    <option key={idx} value={idx}>
                      {new Date(2000, idx, 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>

                <select
                  id="admin-start-year"
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
                  disabled={isPending}
                >
                  {Array.from({ length: 3 }).map((_, idx) => {
                    const yr = now.getFullYear() + idx;
                    return (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Application
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
