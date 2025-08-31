
"use client";

import { useActionState } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, FileUp, Info, Loader2, UploadCloud, List, Wallet, HandCoins } from "lucide-react";
import { bulkImportData } from "./actions";

const initialState = {
  error: null,
  success: null,
  summary: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 animate-spin" />
          Importing Data... Please Wait.
        </>
      ) : (
        <>
          <UploadCloud className="mr-2" />
          Start Import
        </>
      )}
    </Button>
  );
}

export default function BulkImportPage() {
  const [state, formAction] = useActionState(bulkImportData, initialState as any);

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <form action={formAction}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadCloud />
              Bulk Data Import Tool
            </CardTitle>
            <CardDescription>
              Use this tool to migrate existing data from spreadsheets into the application.
              Ensure your files are in the correct `.xlsx` format.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Instructions</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Use the exact column headers specified for each file to avoid errors.</li>
                  <li>The <strong className="text-primary">'MembershipNumber'</strong> is the critical key used to link all three files together. Ensure it is consistent for each member.</li>
                  <li>All three files are required for the import to work correctly.</li>
                  <li>The import process will not create duplicates if a membership number already exists.</li>
                  <li>All imported members will have a temporary password in the format: <strong className="text-primary font-mono bg-background p-1 rounded">password&lt;MembershipNumber&gt;</strong> (e.g., if Membership Number is 123, password is 'password123'). They should be instructed to change it after their first login.</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-secondary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2"><List />Members File</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                      <Label htmlFor="membersFile">1. Members.xlsx</Label>
                      <Input id="membersFile" name="membersFile" type="file" required accept=".xlsx" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Required Columns: <code className="font-mono bg-background p-1 rounded">MembershipNumber</code>, <code className="font-mono bg-background p-1 rounded">FullName</code>, <code className="font-mono bg-background p-1 rounded">PhoneNumber</code>, <code className="font-mono bg-background p-1 rounded">JoinDate</code>, <code className="font-mono bg-background p-1 rounded">Status</code>, etc.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-secondary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2"><Wallet />Funds File</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                   <div className="space-y-1">
                      <Label htmlFor="fundsFile">2. Fund_Balances.xlsx</Label>
                      <Input id="fundsFile" name="fundsFile" type="file" required accept=".xlsx" />
                   </div>
                  <p className="text-xs text-muted-foreground">
                    Required Columns: <code className="font-mono bg-background p-1 rounded">MembershipNumber</code>, <code className="font-mono bg-background p-1 rounded">ShareFund</code>, <code className="font-mono bg-background p-1 rounded">GuaranteedFund</code>, <code className="font-mono bg-background p-1 rounded">ThriftFund</code>.
                  </p>
                </CardContent>
              </Card>

               <Card className="bg-secondary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2"><HandCoins />Loans File</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                   <div className="space-y-1">
                      <Label htmlFor="loansFile">3. Loans.xlsx</Label>
                      <Input id="loansFile" name="loansFile" type="file" required accept=".xlsx" />
                   </div>
                   <p className="text-xs text-muted-foreground">
                    Required Columns: <code className="font-mono bg-background p-1 rounded">MembershipNumber</code>, <code className="font-mono bg-background p-1 rounded">LoanIssueDate</code>, <code className="font-mono bg-background p-1 rounded">OriginalLoanAmount</code>, etc.
                  </p>
                </CardContent>
              </Card>
            </div>

            {state.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Import Failed</AlertTitle>
                <AlertDescription className="whitespace-pre-wrap">
                  {state.error}
                </AlertDescription>
              </Alert>
            )}

            {state.success && state.summary && (
              <Alert variant="default" className="bg-green-600/10 border-green-600/30 text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>Import Successful!</AlertTitle>
                <AlertDescription className="whitespace-pre-wrap">
                  {state.summary}
                </AlertDescription>
              </Alert>
            )}

          </CardContent>
          <CardFooter className="border-t pt-6">
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
