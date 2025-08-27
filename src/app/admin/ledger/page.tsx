
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getLedgerData } from "./actions";
import { BookCopy, DollarSign, PiggyBank, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ILoan } from "@/models/loan";

interface PopulatedLoan extends ILoan {
    user: {
        _id: string;
        name: string;
        email: string;
    }
}

export default async function LedgerPage() {
  const { loans, totalCapital } = await getLedgerData();

  const loanStatusVariant: { [key: string]: "default" | "secondary" | "outline" | "destructive" } = {
      active: 'default',
      paid: 'secondary',
      pending: 'outline',
      rejected: 'destructive'
  };

  const StatCard = ({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookCopy /> Loan Ledger & Financial Overview</CardTitle>
          <CardDescription>
            A comprehensive view of all loans and the bank's capital.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-3">
          <StatCard 
            title="Total Capital (Share + Guaranteed)" 
            value={`₹${totalCapital.total.toLocaleString()}`} 
            icon={<DollarSign className="size-4 text-muted-foreground" />}
          />
          <StatCard 
            title="Total Share Fund" 
            value={`₹${totalCapital.shareFund.toLocaleString()}`}
            icon={<PiggyBank className="size-4 text-muted-foreground" />}
           />
          <StatCard 
            title="Total Guaranteed Fund" 
            value={`₹${totalCapital.guaranteedFund.toLocaleString()}`}
            icon={<ShieldCheck className="size-4 text-muted-foreground" />}
           />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Loans</CardTitle>
          <CardDescription>
            A complete list of every loan application in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Loan Amount</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Monthly Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issued On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.map((loan: PopulatedLoan) => (
                <TableRow key={loan._id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/users/${loan.user._id}`} className="text-primary hover:underline">
                      {loan.user.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{loan.user.email}</p>
                  </TableCell>
                  <TableCell>₹{loan.loanAmount.toLocaleString()}</TableCell>
                  <TableCell>₹{loan.principal.toLocaleString()}</TableCell>
                  <TableCell>₹{loan.monthlyPrincipalPayment.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={loanStatusVariant[loan.status]} className="capitalize">
                      {loan.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {loan.status !== 'pending' ? new Date(loan.issueDate).toLocaleDateString() : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
