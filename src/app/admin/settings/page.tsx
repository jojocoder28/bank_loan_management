
"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBankSettings, updateBankSettings } from "./actions";
import { Loader2, Save, Settings as SettingsIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { IBank } from "@/models/bank";
import { Skeleton } from "@/components/ui/skeleton";

type PageState = {
  settings: IBank | null;
  loading: boolean;
  formState: {
    error: any | null;
    success: string | null;
  }
};

const initialState: PageState['formState'] = {
  error: null,
  success: null
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 animate-spin" />
          Saving...
        </>
      ) : (
         <>
          <Save className="mr-2" />
          Save Settings
         </>
      )}
    </Button>
  );
}

export default function AdminSettingsPage() {
  const [pageState, setPageState] = useActionState(async (prevState: PageState, formData: FormData) => {
    const result = await updateBankSettings(prevState.formState, formData);
    return { ...prevState, formState: result };
  }, { settings: null, loading: true, formState: initialState });

  const { toast } = useToast();

  useEffect(() => {
    async function loadSettings() {
      const settings = await getBankSettings();
      setPageState(prev => ({...prev, settings, loading: false}));
    }
    loadSettings();
  }, []);
  
  useEffect(() => {
    if (pageState.formState?.error) {
      const errorMsg = typeof pageState.formState.error === 'object' 
        ? Object.values(pageState.formState.error).flat().join(', ')
        : pageState.formState.error;
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: errorMsg,
      });
    }
     if (pageState.formState?.success) {
      toast({
        title: "Success",
        description: pageState.formState.success,
      });
    }
  }, [pageState.formState, toast]);

  if (pageState.loading) {
    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="grid gap-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="grid gap-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
            <CardFooter>
                 <Skeleton className="h-10 w-32" />
            </CardFooter>
        </Card>
    );
  }


  return (
    <form action={setPageState}>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon />
            Bank Settings
          </CardTitle>
          <CardDescription>
            Manage the bank's core financial parameters. These values affect all users.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
              <Label htmlFor="loanInterestRate">Loan Interest Rate (%)</Label>
              <Input 
                id="loanInterestRate" 
                name="loanInterestRate" 
                type="number"
                defaultValue={pageState.settings?.loanInterestRate ?? 10}
                step="0.1"
                required 
               />
              <p className="text-xs text-muted-foreground">The annual interest rate charged on all active loans.</p>
               {pageState.formState.error?.loanInterestRate && <p className="text-sm text-destructive">{pageState.formState.error.loanInterestRate[0]}</p>}
          </div>
            <div className="grid gap-2">
              <Label htmlFor="thriftFundInterestRate">Thrift Fund Interest Rate (%)</Label>
              <Input 
                id="thriftFundInterestRate" 
                name="thriftFundInterestRate" 
                type="number" 
                defaultValue={pageState.settings?.thriftFundInterestRate ?? 6}
                step="0.1"
                required 
              />
               <p className="text-xs text-muted-foreground">The annual interest rate paid to members for their thrift fund balance.</p>
              {pageState.formState.error?.thriftFundInterestRate && <p className="text-sm text-destructive">{pageState.formState.error.thriftFundInterestRate[0]}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
            <SubmitButton />
        </CardFooter>
      </Card>
    </form>
  );
}
