
"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPaymentChange } from "../actions";
import { Loader2, Save, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ILoan } from "@/models/loan";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
        <Save className="mr-2" />
      )}
      Request Change
    </Button>
  );
}

export function UpdatePaymentForm({ loan }: { loan: ILoan }) {
  const [state, formAction] = useActionState(requestPaymentChange, initialState);
  const [amount, setAmount] = useState(loan.monthlyPrincipalPayment ?? 0);
  const [reqType, setReqType] = useState<"temporary" | "permanent">("temporary");
  const [durationMonths, setDurationMonths] = useState<string>("1");
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
        description: "Your request to change the monthly payment has been submitted for admin approval.",
      });
    }
  }, [state, toast]);

  return (
    <Card className="flex flex-col">
        <form action={formAction}>
        <CardHeader>
            <CardTitle className="text-xl">Change Monthly Payment</CardTitle>
            <CardDescription>Request a temporary or permanent change to your monthly principal payment.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
            <input type="hidden" name="loanId" value={loan._id.toString()} />
            
            <div className="space-y-2">
                 <Label htmlFor="new-payment">New Monthly Principal</Label>
                 <Input
                    id="new-payment"
                    type="number"
                    name="newMonthlyPayment"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    min="0"
                    step="100"
                />
            </div>

            <div className="space-y-2">
                 <Label>Request Duration</Label>
                 <RadioGroup
                    value={reqType}
                    onValueChange={(val: any) => setReqType(val)}
                    name="requestType"
                    className="grid grid-cols-2 gap-3"
                 >
                   <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-accent/40 cursor-pointer">
                     <RadioGroupItem value="temporary" id="req-temporary" />
                     <Label htmlFor="req-temporary" className="cursor-pointer font-medium text-xs">For next month only</Label>
                   </div>
                   <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-accent/40 cursor-pointer">
                     <RadioGroupItem value="permanent" id="req-permanent" />
                     <Label htmlFor="req-permanent" className="cursor-pointer font-medium text-xs">Permanent change</Label>
                   </div>
                 </RadioGroup>
            </div>

            {reqType === "temporary" && (
              <div className="space-y-2">
                <Label htmlFor="duration-months">Duration (Months)</Label>
                <Select value={durationMonths} onValueChange={setDurationMonths} name="durationMonths">
                  <SelectTrigger id="duration-months">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Month</SelectItem>
                    <SelectItem value="2">2 Months</SelectItem>
                    <SelectItem value="3">3 Months</SelectItem>
                    <SelectItem value="6">6 Months</SelectItem>
                    <SelectItem value="12">12 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Alert variant="default" className="text-xs">
                <Info className="size-4" />
                <AlertDescription>
                    {reqType === 'temporary' 
                      ? `This is a temporary change for your next ${durationMonths} payment cycle${Number(durationMonths) > 1 ? 's' : ''}. Your payment amount will revert to the original value afterwards.`
                      : "This is a permanent change to your monthly principal payment amount."
                    } This request requires admin approval.
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
