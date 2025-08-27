
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PiggyBank, ShieldCheck, Download, Handshake } from 'lucide-react';
import { getMyFinancesData } from './actions';
import { redirect } from 'next/navigation';
import { ILoan } from '@/models/loan';
import { LoanWalkthrough } from './_components/loan-walkthrough';
import { UpdatePaymentForm } from './_components/update-payment';

export default async function MyFinancesPage() {
  const data = await getMyFinancesData();

  if (!data) {
    redirect('/dashboard');
  }

  const { user, allLoans } = data;

  const loanStatusVariant: { [key: string]: "default" | "secondary" | "outline" | "destructive" } = {
      active: 'default',
      paid: 'secondary',
      pending: 'outline',
      rejected: 'destructive'
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Top section with Fund Balances and Download button */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>My Financial Statement</CardTitle>
            <CardDescription>
              A complete overview of your funds and loan history.
            </CardDescription>
          </div>
           <Button variant="outline">
                <Download className="mr-2" />
                Download Report
            </Button>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full"><PiggyBank className="size-5 text-primary" /></div>
                <p className="font-medium">Share Fund</p>
              </div>
              <p className="font-bold text-lg">₹{user.shareFund.toLocaleString()}</p>
            </div>
             <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-accent/10 rounded-full"><ShieldCheck className="size-5 text-accent" /></div>
                <p className="font-medium">Guaranteed Fund</p>
              </div>
              <p className="font-bold text-lg">₹{user.guaranteedFund.toLocaleString()}</p>
            </div>
        </CardContent>
      </Card>
      
      {/* Loan History Section */}
      <Card>
          <CardHeader>
              <CardTitle>Loan History</CardTitle>
              <CardDescription>A complete record of all your loan applications.</CardDescription>
          </CardHeader>
          <CardContent>
              {allLoans.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Applied On</TableHead>
                            <TableHead>Loan Amount</TableHead>
                            <TableHead>Outstanding</TableHead>
                            <TableHead>Monthly Payment</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Walkthrough</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allLoans.map((loan: ILoan) => (
                            <TableRow key={loan._id.toString()}>
                                <TableCell>{new Date(loan.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>₹{loan.loanAmount.toLocaleString()}</TableCell>
                                <TableCell>₹{loan.principal.toLocaleString()}</TableCell>
                                <TableCell>
                                    {loan.status === 'active' ? (
                                        <UpdatePaymentForm loan={loan} />
                                    ) : (
                                        `₹${loan.monthlyPrincipalPayment.toLocaleString()}`
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={loanStatusVariant[loan.status]} className="capitalize">{loan.status}</Badge>
                                </TableCell>
                                 <TableCell className="text-right">
                                    {['active', 'paid'].includes(loan.status) ? (
                                        <LoanWalkthrough loan={loan} />
                                    ) : (
                                        <Button variant="outline" size="sm" disabled>
                                            N/A
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                    <Handshake className="mx-auto h-12 w-12" />
                    <p className="mt-4">You have not applied for any loans yet.</p>
                </div>
              )}
          </CardContent>
      </Card>

    </div>
  );
}
