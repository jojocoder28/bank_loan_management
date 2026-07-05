"use client";

export const dynamic = 'force-dynamic';

import { useActionState, useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addMember } from "./actions";
import { getBankSettings } from "../../settings/actions";
import { 
  UserPlus, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Copy, 
  Check, 
  ArrowLeft, 
  User, 
  Coins, 
  Users2, 
  ShieldAlert,
  MapPin,
  Landmark
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

const initialState = {
  error: null,
  success: false,
  credentials: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Loader2 className="mr-2 animate-spin size-4" />
          Creating Member...
        </>
      ) : (
        <>
          <UserPlus className="mr-2 size-4" />
          Create Member Account
        </>
      )}
    </Button>
  );
}

export default function AddMemberPage() {
  const [state, formAction] = useActionState(addMember, initialState as any);
  const [initialShareFund, setInitialShareFund] = useState(5000);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getBankSettings();
        if (settings?.initialShareFundDeposit) {
          setInitialShareFund(settings.initialShareFundDeposit);
        }
      } catch (e) {
        console.error("Failed to load bank settings", e);
      }
    }
    loadSettings();
  }, []);

  const copyCredentials = () => {
    if (!state.credentials) return;
    const text = `Member Credentials Summary:
----------------------------
Name: ${state.credentials.name}
Membership #: ${state.credentials.membershipNumber}
Username (Phone): ${state.credentials.phone}
Temporary Password: ${state.credentials.password}
----------------------------
Note: The member is required to change their password on first login.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If successfully created, show the beautiful success card with copy details button
  if (state.success && state.credentials) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <Card className="border-green-500/20 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-green-500/10 p-3 rounded-full w-fit mb-4">
              <CheckCircle2 className="size-12 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-500">
              Member Created Successfully!
            </CardTitle>
            <CardDescription>
              Account has been registered and initialized in the database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border bg-muted/40 p-4 space-y-3 font-sans">
              <h3 className="font-semibold text-sm text-muted-foreground border-b pb-2">
                Temporary Login Credentials
              </h3>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="font-medium text-muted-foreground">Full Name:</span>
                <span className="col-span-2 font-semibold">{state.credentials.name}</span>

                <span className="font-medium text-muted-foreground">Membership #:</span>
                <span className="col-span-2 font-semibold">{state.credentials.membershipNumber}</span>

                <span className="font-medium text-muted-foreground">Username (Phone):</span>
                <span className="col-span-2 font-mono font-bold text-primary">{state.credentials.phone}</span>

                <span className="font-medium text-muted-foreground">Temp Password:</span>
                <span className="col-span-2 font-mono font-bold text-green-600 dark:text-green-400">
                  {state.credentials.password}
                </span>
              </div>
            </div>

            <Alert variant="default" className="bg-amber-600/10 border-amber-600/20 text-amber-800 dark:text-amber-300">
              <ShieldAlert className="size-4 text-amber-600" />
              <AlertTitle className="font-semibold">Security Warning</AlertTitle>
              <AlertDescription className="text-xs">
                The member is flagged with <strong>requiresPasswordChange</strong>. They will be prompted to set a new password immediately upon their first login.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2 border-t pt-6 justify-between">
            <Button variant="outline" onClick={copyCredentials} className="w-full sm:w-auto">
              {copied ? (
                <>
                  <Check className="mr-2 size-4 text-green-500" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 size-4" /> Copy Details
                </>
              )}
            </Button>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <Button variant="ghost" asChild className="w-full sm:w-auto">
                <Link href="/admin/users">Back to Users</Link>
              </Button>
              <Button onClick={() => window.location.reload()} className="w-full sm:w-auto">
                Register Another
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="size-5" />
            <span className="sr-only">Back to users</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Member</h1>
          <p className="text-muted-foreground text-sm">
            Manually register a new cooperative society member with initial balances and details.
          </p>
        </div>
      </div>

      <form action={formAction}>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            {state?.error?.form && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{state.error.form[0]}</AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-auto gap-1 bg-muted p-1 mb-6 flex-wrap">
                <TabsTrigger value="general" className="py-2 justify-center gap-2">
                  <User className="size-4 hidden sm:inline" />
                  <span>General</span>
                </TabsTrigger>
                <TabsTrigger value="financials" className="py-2 justify-center gap-2">
                  <Coins className="size-4 hidden sm:inline" />
                  <span>Financials</span>
                </TabsTrigger>
                <TabsTrigger value="personal" className="py-2 justify-center gap-2">
                  <MapPin className="size-4 hidden sm:inline" />
                  <span>Personal</span>
                </TabsTrigger>
                <TabsTrigger value="nominee" className="py-2 justify-center gap-2">
                  <Users2 className="size-4 hidden sm:inline" />
                  <span>Nominee</span>
                </TabsTrigger>
              </TabsList>

              {/* GENERAL INFORMATION TAB */}
              <TabsContent value="general" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                    <Input id="name" name="name" placeholder="E.g. MD MASIUR RAHAMAN DOPTARY" required />
                    {state?.error?.name && <p className="text-xs text-destructive">{state.error.name[0]}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="membershipNumber">Membership # <span className="text-destructive">*</span></Label>
                    <Input id="membershipNumber" name="membershipNumber" placeholder="E.g. 101/26" required />
                    {state?.error?.membershipNumber && <p className="text-xs text-destructive">{state.error.membershipNumber[0]}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
                    <Input id="phone" name="phone" type="tel" placeholder="E.g. 9876543210" required />
                    {state?.error?.phone && <p className="text-xs text-destructive">{state.error.phone[0]}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" name="email" type="email" placeholder="E.g. member@example.com" />
                    {state?.error?.email && <p className="text-xs text-destructive">{state.error.email[0]}</p>}
                  </div>
                </div>
              </TabsContent>

              {/* FINANCIAL BALANCES TAB */}
              <TabsContent value="financials" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="shareFund">Share Fund Balance (₹) <span className="text-destructive">*</span></Label>
                    <Input 
                      id="shareFund" 
                      name="shareFund" 
                      type="number" 
                      defaultValue={initialShareFund} 
                      min="0"
                      required 
                    />
                    <p className="text-[10px] text-muted-foreground">Default set from system settings.</p>
                    {state?.error?.shareFund && <p className="text-xs text-destructive">{state.error.shareFund[0]}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="thriftFund">Thrift Fund Balance (₹) <span className="text-destructive">*</span></Label>
                    <Input id="thriftFund" name="thriftFund" type="number" defaultValue="0" min="0" required />
                    {state?.error?.thriftFund && <p className="text-xs text-destructive">{state.error.thriftFund[0]}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="guaranteedFund">Guaranteed Fund Balance (₹) <span className="text-destructive">*</span></Label>
                    <Input id="guaranteedFund" name="guaranteedFund" type="number" defaultValue="0" min="0" required />
                    {state?.error?.guaranteedFund && <p className="text-xs text-destructive">{state.error.guaranteedFund[0]}</p>}
                  </div>
                </div>
              </TabsContent>

              {/* PERSONAL DETAILS TAB */}
              <TabsContent value="personal" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                    <Input id="bankAccountNumber" name="bankAccountNumber" placeholder="E.g. SBI 3192039281" />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" name="age" type="number" placeholder="E.g. 35" min="18" max="100" />
                    {state?.error?.age && <p className="text-xs text-destructive">{state.error.age[0]}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="gender">Gender</Label>
                    <select 
                      id="gender" 
                      name="gender" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {state?.error?.gender && <p className="text-xs text-destructive">{state.error.gender[0]}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="profession">Profession</Label>
                    <Input id="profession" name="profession" placeholder="E.g. Teacher" />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="workplace">Workplace</Label>
                    <Input id="workplace" name="workplace" placeholder="E.g. Sarisha Primary School" />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="workplaceAddress">Workplace Address</Label>
                    <Input id="workplaceAddress" name="workplaceAddress" placeholder="Work address" />
                  </div>

                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="personalAddress">Personal Address</Label>
                    <Input id="personalAddress" name="personalAddress" placeholder="Home address" />
                  </div>
                </div>
              </TabsContent>

              {/* NOMINEE DETAILS TAB */}
              <TabsContent value="nominee" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="nomineeName">Nominee Name</Label>
                    <Input id="nomineeName" name="nomineeName" placeholder="E.g. Jane Doe" />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="nomineeRelation">Relation to Member</Label>
                    <Input id="nomineeRelation" name="nomineeRelation" placeholder="E.g. Spouse / Son / Daughter" />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="nomineeAge">Nominee Age</Label>
                    <Input id="nomineeAge" name="nomineeAge" type="number" placeholder="E.g. 30" min="1" max="100" />
                    {state?.error?.nomineeAge && <p className="text-xs text-destructive">{state.error.nomineeAge[0]}</p>}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-2 border-t pt-6 justify-between">
            <div className="text-xs text-muted-foreground text-center sm:text-left">
              Fields marked with <span className="text-destructive">*</span> are required.
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/admin/users" className="w-full justify-center">Cancel</Link>
              </Button>
              <SubmitButton />
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
