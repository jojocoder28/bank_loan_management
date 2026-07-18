"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Edit3, PiggyBank, ShieldCheck, Wallet } from "lucide-react";
import { updateUserCapital } from "../actions";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export function CapitalManagement({ userId, shareFund, thriftFund, guaranteedFund, dividendFund }: {
    userId: string;
    shareFund: number;
    thriftFund: number;
    guaranteedFund: number;
    dividendFund: number;
}) {
  const [state, formAction] = useActionState(updateUserCapital, initialState);
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
        title: "Capital Updated",
        description: "The member's capital balances have been successfully updated.",
      });
      setOpen(false);
    }
  }, [state, toast]);

  return (
    <Card>
      <CardHeader className="pb-3 border-b bg-muted/10 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <PiggyBank className="size-4 text-primary" /> Capital Balances
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2 h-8 px-2.5">
              <Edit3 className="size-3.5" />
              Adjust
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adjust Capital Balances</DialogTitle>
              <DialogDescription>
                Manually adjust the member's fund balances. This change will be reflected in statements and interest calculations.
              </DialogDescription>
            </DialogHeader>
            <form action={formAction} className="grid gap-4 py-4">
              <input type="hidden" name="userId" value={userId} />
              
              <div className="grid gap-2">
                <Label htmlFor="shareFund" className="flex items-center gap-2">
                  <PiggyBank className="size-4 text-primary" /> Share Fund (SF)
                </Label>
                <Input
                  id="shareFund"
                  name="shareFund"
                  type="number"
                  defaultValue={shareFund}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="thriftFund" className="flex items-center gap-2">
                  <Wallet className="size-4 text-primary" /> Thrift Fund (TF)
                </Label>
                <Input
                  id="thriftFund"
                  name="thriftFund"
                  type="number"
                  defaultValue={thriftFund}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="guaranteedFund" className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-green-600" /> Guaranteed Fund (GF)
                </Label>
                <Input
                  id="guaranteedFund"
                  name="guaranteedFund"
                  type="number"
                  defaultValue={guaranteedFund}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dividendFund" className="flex items-center gap-2">
                  <PiggyBank className="size-4 text-amber-500" /> Dividend Fund (DF)
                </Label>
                <Input
                  id="dividendFund"
                  name="dividendFund"
                  type="number"
                  defaultValue={dividendFund}
                  min="0"
                  step="0.01"
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
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 transition-all duration-300 hover:bg-primary/10 flex flex-col justify-between">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Share Fund</p>
            <p className="text-xs font-bold text-primary mt-1">₹{(shareFund ?? 0).toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/10 transition-all duration-300 hover:bg-green-500/10 flex flex-col justify-between">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Thrift Fund</p>
            <p className="text-xs font-bold text-green-500 mt-1">₹{(thriftFund ?? 0).toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 transition-all duration-300 hover:bg-purple-500/10 flex flex-col justify-between">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Guaranteed</p>
            <p className="text-xs font-bold text-purple-500 mt-1">₹{(guaranteedFund ?? 0).toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 transition-all duration-300 hover:bg-amber-500/10 flex flex-col justify-between">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Dividend</p>
            <p className="text-xs font-bold text-amber-500 mt-1">₹{(dividendFund ?? 0).toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
