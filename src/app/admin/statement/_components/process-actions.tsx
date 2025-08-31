
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Cog, Calendar, Gift } from "lucide-react";
import { useTransition } from "react";
import { processMonthlyDeductions, processAllAnnualDues } from "../actions";

export function ProcessActions() {
  const { toast } = useToast();
  const [isMonthlyPending, startMonthlyTransition] = useTransition();
  const [isAnnualPending, startAnnualTransition] = useTransition();

  const handleProcessMonthly = () => {
    startMonthlyTransition(async () => {
      const result = await processMonthlyDeductions();
      if (result.error) {
        toast({ variant: 'destructive', title: "Processing Failed", description: result.error });
      } else {
        toast({ title: 'Success', description: result.success });
      }
    });
  };

  const handleProcessAnnual = () => {
    startAnnualTransition(async () => {
      const result = await processAllAnnualDues();
      if (result.error) {
        toast({ variant: 'destructive', title: "Processing Failed", description: result.error });
      } else {
        toast({ title: 'Success', description: result.success });
      }
    });
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">
            {isMonthlyPending ? <Loader2 className="mr-2 animate-spin" /> : <Cog className="mr-2" />}
            Process Monthly Deductions
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will process monthly thrift and loan payments for all active members. This action can only be performed ONCE per month. Ensure all data for the current month is correct before proceeding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleProcessMonthly} disabled={isMonthlyPending}>
              Yes, Process Monthly Deductions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline">
            {isAnnualPending ? <Loader2 className="mr-2 animate-spin" /> : <Gift className="mr-2" />}
            Process All Annual Dues
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will calculate and credit the annual interest for the Thrift Fund, Guaranteed Fund, and the annual dividend for the Share Fund for all active members. This action can only be performed ONCE per year.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleProcessAnnual} disabled={isAnnualPending}>
              Yes, Process Annual Dues
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
