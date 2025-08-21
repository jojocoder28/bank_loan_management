
"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { runAudit } from "./actions";
import { Loader2, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const initialState = {
  analysisResult: "",
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <Loader2 className="mr-2 animate-spin" />
      ) : (
        <Sparkles className="mr-2" />
      )}
      Run Audit
    </Button>
  );
}

export default function AiAuditPage() {
  const [state, formAction] = useActionState(runAudit, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.error) {
      toast({
        variant: "destructive",
        title: "Audit Failed",
        description: state.error as string,
      });
    }
  }, [state.error, toast]);

  const { pending } = useFormStatus();

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>AI Financial Auditor</CardTitle>
          <CardDescription>
            Compare monthly balance sheets with historical data to find anomalies.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="currentBalanceSheetData">
                Current Month's Balance Sheet (JSON)
              </Label>
              <Textarea
                id="currentBalanceSheetData"
                name="currentBalanceSheetData"
                placeholder='{ "assets": 105000, "liabilities": 50000, "equity": 55000 }'
                rows={5}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="historicalBalanceSheetData">
                Historical Averages (JSON)
              </Label>
              <Textarea
                id="historicalBalanceSheetData"
                name="historicalBalanceSheetData"
                placeholder='{ "assets": 100000, "liabilities": 48000, "equity": 52000 }'
                rows={5}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="discrepancyThreshold">
                Discrepancy Threshold (%)
              </Label>
              <Input
                id="discrepancyThreshold"
                name="discrepancyThreshold"
                type="number"
                defaultValue="5"
                required
                className="w-48"
              />
            </div>
            <SubmitButton />
          </CardContent>
        </form>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Analysis Result</CardTitle>
          <CardDescription>
            AI-powered insights into your financial data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pending ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : state.analysisResult ? (
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-sans">
              {state.analysisResult}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Sparkles className="mx-auto h-12 w-12 " />
              <p className="mt-4">
                Your audit results will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
