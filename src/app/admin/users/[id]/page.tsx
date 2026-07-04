
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getUserDetails } from "./actions";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Banknote,
  Shield,
  Calendar,
  Building,
  ClipboardList,
  History,
  Activity
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ILoan } from "@/models/loan";
import { RoleManagement } from "./_components/role-management";
import { CapitalManagement } from "./_components/capital-management";
import { LoanPaymentModifier } from "./_components/loan-payment-modifier";
import { getSession } from "@/lib/session";
import { UserStatus } from "@/models/user";
import { cn } from "@/lib/utils";

export default async function UserDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const { user, loans } = await getUserDetails(params.id);
  const session = await getSession();

  if (!user) {
    notFound();
  }
  
  const activeLoans = loans.filter(loan => loan.status === 'active');
  const pastLoans = loans.filter(loan => ['paid', 'rejected'].includes(loan.status));

  const roleVariant: { [key: string]: "default" | "secondary" | "outline" } = {
    admin: "default",
    board_member: "secondary",
    member: "outline",
    user: "outline"
  };
  
  const loanStatusVariant: { [key: string]: "default" | "secondary" | "outline" | "destructive" } = {
      active: 'default',
      paid: 'secondary',
      pending: 'outline',
      rejected: 'destructive'
  }
  
  const userStatusVariant: { [key in UserStatus]: "default" | "destructive" | "secondary" } = {
      active: 'default',
      inactive: 'destructive',
      retired: 'secondary'
  }

  const InfoField = ({ icon, label, value, className }: { icon: React.ReactNode, label: string, value?: string | number | null, className?: string }) => (
      <div className={cn("flex items-start gap-3", className)}>
        <div className="text-muted-foreground mt-1">{icon}</div>
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium">{value || "N/A"}</p>
        </div>
      </div>
  )
  
  const canEditRole = session?.id !== user._id && user.role !== 'admin';

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Header Card (Full Width) */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Avatar className="h-20 w-20 border-2 border-primary/20 shadow-md">
                <AvatarImage src={user.photoUrl ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                  {user.name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{user.name}</h1>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="flex gap-2 items-center pt-1.5">
                  <Badge variant={roleVariant[user.role] || "outline"} className="capitalize px-2.5 py-0.5">
                      {user.role.replace("_", " ")}
                  </Badge>
                  <Badge variant={userStatusVariant[user.status] || "outline"} className="capitalize px-2.5 py-0.5">
                      {user.status}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-auto min-w-[280px] p-4 bg-muted/20 border border-border/40 rounded-xl">
              {canEditRole ? (
                  <RoleManagement userId={user._id.toString()} currentRole={user.role} />
              ) : (
                  <div className="text-xs text-muted-foreground text-center">
                      {user.role === 'admin' ? "Admin roles cannot be changed." : "You cannot change your own role."}
                  </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Main Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Left Column (Coop & Loan Details - Spans 2 columns) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Capital Balances */}
          {user.role === 'member' && (
            <CapitalManagement 
                userId={user._id.toString()} 
                shareFund={user.shareFund ?? 0}
                thriftFund={user.thriftFund ?? 0}
                guaranteedFund={user.guaranteedFund ?? 0}
            />
          )}

          {/* Active Loans */}
          <Card>
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="size-4 text-primary" /> Active Loans
              </CardTitle>
              <CardDescription>
                All loans currently in active status for this member.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
               {activeLoans.length > 0 ? (
                  <div className="w-full overflow-x-auto">
                      <LoanTable loans={activeLoans} statusVariant={loanStatusVariant} showActions={true} />
                  </div>
               ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">No active loans.</p>
               )}
            </CardContent>
          </Card>
          
          {/* Loan History */}
          <Card>
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <History className="size-4 text-primary" /> Loan History
              </CardTitle>
              <CardDescription>
                  A record of all past loans for this member.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
               {pastLoans.length > 0 ? (
                  <div className="w-full overflow-x-auto">
                   <LoanTable loans={pastLoans} statusVariant={loanStatusVariant} />
                  </div>
               ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">No past loans to display.</p>
               )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Member Personal/Nominee Details - Spans 1 column) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Personal Details */}
          <Card>
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="size-4 text-primary" /> Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 gap-y-4 gap-x-3">
               <InfoField icon={<User className="size-4"/>} label="Gender" value={user.gender} className="capitalize" />
               <InfoField icon={<Calendar className="size-4"/>} label="Age" value={user.age} />
               <InfoField icon={<Phone className="size-4"/>} label="Phone" value={user.phone} className="col-span-2" />
               <InfoField icon={<ClipboardList className="size-4"/>} label="Membership #" value={user.membershipNumber} className="col-span-2" />
               <InfoField icon={<Banknote className="size-4"/>} label="Bank Account" value={user.bankAccountNumber} className="col-span-2" />
               <InfoField icon={<MapPin className="size-4"/>} label="Address" value={user.personalAddress} className="col-span-2" />
            </CardContent>
          </Card>

          {/* Professional Details */}
          <Card>
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Briefcase className="size-4 text-primary" /> Professional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 gap-y-4 gap-x-3">
               <InfoField icon={<Briefcase className="size-4"/>} label="Profession" value={user.profession} className="col-span-2" />
               <InfoField icon={<Building className="size-4"/>} label="Workplace" value={user.workplace} className="col-span-2" />
               <InfoField icon={<MapPin className="size-4"/>} label="Workplace Address" value={user.workplaceAddress} className="col-span-2" />
            </CardContent>
          </Card>

          {/* Nominee Details */}
          <Card>
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="size-4 text-primary" /> Nominee Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 gap-y-4 gap-x-3">
               <InfoField icon={<User className="size-4"/>} label="Nominee Name" value={user.nomineeName} className="col-span-2" />
               <InfoField icon={<Shield className="size-4"/>} label="Relation" value={user.nomineeRelation} />
               <InfoField icon={<Calendar className="size-4"/>} label="Nominee Age" value={user.nomineeAge} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


const LoanTable = ({ loans, statusVariant, showActions = false }: { loans: ILoan[], statusVariant: any, showActions?: boolean }) => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Issued Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Interest</TableHead>
                <TableHead>Monthly Payment</TableHead>
                <TableHead>Status</TableHead>
                {showActions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
        </TableHeader>
        <TableBody>
            {loans.map(loan => (
                <TableRow key={loan._id.toString()}>
                    <TableCell>{loan.issueDate ? new Date(loan.issueDate).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>₹{loan.loanAmount.toLocaleString()}</TableCell>
                    <TableCell>₹{loan.principal.toLocaleString()}</TableCell>
                    <TableCell>{loan.interestRate}%</TableCell>
                    <TableCell>₹{(loan.monthlyPrincipalPayment ?? 0).toLocaleString()}</TableCell>
                    <TableCell>
                        <Badge variant={statusVariant[loan.status]} className="capitalize">{loan.status}</Badge>
                    </TableCell>
                    {showActions && (
                        <TableCell className="text-right">
                            <LoanPaymentModifier 
                                loanId={loan._id.toString()} 
                                monthlyPrincipalPayment={loan.monthlyPrincipalPayment ?? 0} 
                                maxLimit={loan.principal}
                            />
                        </TableCell>
                    )}
                </TableRow>
            ))}
        </TableBody>
    </Table>
)
