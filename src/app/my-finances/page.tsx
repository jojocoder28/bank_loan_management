
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
import { PiggyBank, ShieldCheck, Handshake, Landmark } from 'lucide-react';
import { getMyFinancesData } from './actions';
import { redirect } from 'next/navigation';
import { ILoan } from '@/models/loan';
import { LoanWalkthrough } from './_components/loan-walkthrough';
import { UpdatePaymentForm } from './_components/update-payment';
import { IncreaseLoanForm } from './_components/increase-loan';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
  
  const activeLoans = allLoans.filter(loan => loan.status === 'active');
  const otherLoans = allLoans.filter(loan => loan.status !== 'active');

  return (
    <div className="flex flex-col gap-8">
      {/* Top section with Fund Balances */}
      <Card>
        <CardHeader>
            <CardTitle>My Financial Statement</CardTitle>
            <CardDescription>
              A complete overview of your funds and loan history.
            </CardDescription>
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
      
      {/* Active Loans Section */}
      <Card>
          <CardHeader>
              <CardTitle>Active Loans</CardTitle>
              <CardDescription>Manage and view details for your active loans. Requests require admin approval.</CardDescription>
          </CardHeader>
          <CardContent>
            {activeLoans.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                    {activeLoans.map((loan, index) => (
                        <AccordionItem value={`item-${index}`} key={loan._id.toString()}>
                            <AccordionTrigger>
                                <div className='flex items-center gap-4'>
                                    <Landmark className='size-5 text-primary' />
                                    <div>
                                        <p>Loan of ₹{loan.loanAmount.toLocaleString()}</p>
                                        <p className='text-sm text-muted-foreground'>Issued on: {new Date(loan.issueDate!).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                               <div className="p-4 bg-secondary/30 rounded-lg">
                                 <div className="grid gap-6 md:grid-cols-2">
                                    <IncreaseLoanForm loan={loan} />
                                    <UpdatePaymentForm loan={loan} />
                                </div>
                               </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                 <div className="text-center text-muted-foreground py-8">
                    <p>You have no active loans.</p>
                </div>
            )}
          </CardContent>
      </Card>

      {/* Loan History Section */}
      <Card>
          <CardHeader>
              <CardTitle>Loan History</CardTitle>
              <CardDescription>A complete record of all your loan applications and their status.</CardDescription>
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
                            <TableHead className="text-right">Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allLoans.map((loan: ILoan) => (
                            <TableRow key={loan._id.toString()}>
                                <TableCell>{new Date(loan.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>₹{loan.loanAmount.toLocaleString()}</TableCell>
                                <TableCell>₹{loan.principal.toLocaleString()}</TableCell>
                                <TableCell>
                                    ₹{(loan.monthlyPrincipalPayment ?? 0).toLocaleString()}
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
