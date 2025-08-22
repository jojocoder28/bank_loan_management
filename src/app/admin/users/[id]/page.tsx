
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
  History
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ILoan } from "@/models/loan";

export default async function UserDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const { user, loans } = await getUserDetails(params.id);

  if (!user) {
    notFound();
  }
  
  const activeLoans = loans.filter(loan => loan.status === 'active');
  const pastLoans = loans.filter(loan => ['paid', 'rejected'].includes(loan.status));

  const roleVariant: { [key: string]: "default" | "secondary" | "outline" } = {
    admin: "default",
    board_member: "secondary",
    member: "outline",
  };
  
  const loanStatusVariant: { [key: string]: "default" | "secondary" | "outline" | "destructive" } = {
      active: 'default',
      paid: 'secondary',
      pending: 'outline',
      rejected: 'destructive'
  }

  const InfoField = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string | number | null }) => (
      <div className="flex items-start gap-3">
        <div className="text-muted-foreground mt-1">{icon}</div>
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium">{value || "N/A"}</p>
        </div>
      </div>
  )

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1 flex flex-col gap-8">
        {/* User Profile Card */}
        <Card>
          <CardHeader className="flex-row items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback>{user.name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user.name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
              <Badge variant={roleVariant[user.role]} className="mt-2 capitalize">
                {user.role.replace("_", " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Separator />
            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                 <InfoField icon={<User className="size-4"/>} label="Gender" value={user.gender} />
                 <InfoField icon={<Calendar className="size-4"/>} label="Age" value={user.age} />
                 <InfoField icon={<Phone className="size-4"/>} label="Phone" value={user.phone} />
                 <InfoField icon={<ClipboardList className="size-4"/>} label="Membership #" value={user.membershipNumber} />
                 <InfoField icon={<MapPin className="size-4"/>} label="Address" value={user.personalAddress} />
                 <InfoField icon={<Banknote className="size-4"/>} label="Bank Account" value={user.bankAccountNumber} />
            </div>
            <Separator />
             <h4 className="font-semibold text-sm">Professional Details</h4>
             <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                 <InfoField icon={<Briefcase className="size-4"/>} label="Profession" value={user.profession} />
                 <InfoField icon={<Building className="size-4"/>} label="Workplace" value={user.workplace} />
                 <InfoField icon={<MapPin className="size-4"/>} label="Workplace Address" value={user.workplaceAddress} />
             </div>
            <Separator />
             <h4 className="font-semibold text-sm">Nominee Details</h4>
             <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                 <InfoField icon={<User className="size-4"/>} label="Nominee Name" value={user.nomineeName} />
                 <InfoField icon={<Shield className="size-4"/>} label="Relation" value={user.nomineeRelation} />
                 <InfoField icon={<Calendar className="size-4"/>} label="Nominee Age" value={user.nomineeAge} />
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 flex flex-col gap-8">
        {/* Active Loans Card */}
        <Card>
          <CardHeader>
            <CardTitle>Active Loans</CardTitle>
            <CardDescription>
              All loans currently in active status for this member.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {activeLoans.length > 0 ? (
                <LoanTable loans={activeLoans} statusVariant={loanStatusVariant} />
             ) : (
                <p className="text-sm text-muted-foreground">No active loans.</p>
             )}
          </CardContent>
        </Card>
        
         {/* Loan History Card */}
        <Card>
          <CardHeader>
            <CardTitle>Loan History</CardTitle>
            <CardDescription>
                A record of all past loans for this member.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {pastLoans.length > 0 ? (
                 <LoanTable loans={pastLoans} statusVariant={loanStatusVariant} />
             ) : (
                <p className="text-sm text-muted-foreground">No past loans to display.</p>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


const LoanTable = ({ loans, statusVariant }: { loans: ILoan[], statusVariant: any }) => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Issued Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Interest</TableHead>
                <TableHead>Status</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {loans.map(loan => (
                <TableRow key={loan._id.toString()}>
                    <TableCell>{new Date(loan.issueDate).toLocaleDateString()}</TableCell>
                    <TableCell>₹{loan.loanAmount.toLocaleString()}</TableCell>
                    <TableCell>₹{loan.principal.toLocaleString()}</TableCell>
                    <TableCell>{loan.interestRate}%</TableCell>
                    <TableCell>
                        <Badge variant={statusVariant[loan.status]} className="capitalize">{loan.status}</Badge>
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
)
