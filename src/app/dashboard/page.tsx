
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Progress } from '@/components/ui/progress';
import {
  Landmark,
  PiggyBank,
  History,
  TrendingUp,
  CreditCard,
  Calendar,
  ShieldCheck,
  Award,
  CircleDollarSign,
  ArrowRight,
  UserCheck,
  Wallet,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import Link from 'next/link';
import { getDashboardData } from './actions';
import { redirect } from 'next/navigation';


export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) {
    redirect('/login');
  }

  const { user, activeLoans, loanHistory } = data;

  const totalLoanAmount = activeLoans.reduce((sum, loan) => sum + loan.loanAmount, 0);
  const totalPrincipalLeft = activeLoans.reduce((sum, loan) => sum + loan.principal, 0);
  const loanProgress = totalLoanAmount > 0 ? ((totalLoanAmount - totalPrincipalLeft) / totalLoanAmount) * 100 : 0;

  const loanStatusVariant: { [key: string]: "default" | "secondary" | "outline" | "destructive" } = {
      active: 'default',
      paid: 'secondary',
      pending: 'outline',
      rejected: 'destructive'
  }

  return (
    <div className="flex flex-col gap-8">
       <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Landmark className="size-6 text-primary" />
              </div>
              <div>
                <CardTitle>Active Loans Overview</CardTitle>
                <CardDescription>
                  {activeLoans.length > 0 ? `You have ${activeLoans.length} active loan(s).`: 'You have no active loans.'}
                </CardDescription>
              </div>
            </div>
             <Button asChild>
                <Link href="/apply-loan">Apply for New Loan <ArrowRight className="ml-2" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-6">
            {activeLoans.length > 0 ? (
              <div>
                <div className='grid grid-cols-2 md:grid-cols-3 gap-4 text-center pb-6'>
                    <div>
                        <p className="text-sm text-muted-foreground">Total Loan Amount</p>
                        <p className="text-2xl font-bold">₹{totalLoanAmount.toLocaleString()}</p>
                    </div>
                     <div>
                        <p className="text-sm text-muted-foreground">Total Principal Left</p>
                        <p className="text-2xl font-bold">₹{totalPrincipalLeft.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Active Loans</p>
                        <p className="text-2xl font-bold">{activeLoans.length}</p>
                    </div>
                </div>
                <Progress value={loanProgress} aria-label={`${loanProgress.toFixed(0)}% of total loans paid`} />
                <p className="text-right text-sm text-muted-foreground pt-2">{loanProgress.toFixed(2)}% Paid</p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>No active loan data to display. Apply for a new loan to get started.</p>
              </div>
            )}
          </CardContent>
           <CardFooter>
                <Button variant="link" asChild>
                    <Link href="/my-finances">Manage Loans & View Details &rarr;</Link>
                </Button>
            </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your Funds</CardTitle>
            <CardDescription>Current balance of your funds.</CardDescription>
          </CardHeader>
           <CardContent className="flex flex-col gap-4">
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
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-purple-500/10 rounded-full"><Wallet className="size-5 text-purple-500" /></div>
                <p className="font-medium">Thrift Fund</p>
              </div>
              <p className="font-bold text-lg">₹{(user.thriftFund ?? 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                  <UserCheck className="size-6 text-primary" />
              </div>
              <div>
                  <CardTitle>Membership Status</CardTitle>
                  <CardDescription>Your current role and status.</CardDescription>
              </div>
          </CardHeader>
          <CardContent className="grid gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <p className="font-medium">Role</p>
                  <Badge variant="outline" className="capitalize">{user.role.replace('_', ' ')}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <p className="font-medium">Membership ID</p>
                  <Badge variant="outline">{user.membershipNumber || 'N/A'}</Badge>
              </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
                <Award className="size-6 text-primary" />
            </div>
            <div>
                <CardTitle>Membership Benefits</CardTitle>
                <CardDescription>Annual perks for all members.</CardDescription>
            </div>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm md:grid-cols-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <p className="font-medium">Annual Durga Puja Dividend</p>
                    <Badge variant="outline">10-12% on Share Fund</Badge>
                </div>
                 <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <p className="font-medium">One-Day Picnic</p>
                    <Badge variant="outline">Fully Self-Sponsored</Badge>
                </div>
                 <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <p className="font-medium">Annual Tour Support</p>
                    <Badge variant="outline">Contribution from Profits</Badge>
                </div>
                 <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <p className="font-medium">Yearly Gift</p>
                    <Badge variant="outline">Yearly Gift</Badge>
                </div>
            </CardContent>
        </Card>
      </div>

       <Card>
          <CardHeader>
            <CardTitle>Recent Loan History</CardTitle>
            <CardDescription>
              Your last 5 loan applications.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {loanHistory.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Applied On</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loanHistory.map(loan => (
                             <TableRow key={loan._id.toString()}>
                                <TableCell>{new Date(loan.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>₹{loan.loanAmount.toLocaleString()}</TableCell>
                                <TableCell>
                                    <Badge variant={loanStatusVariant[loan.status]} className="capitalize">{loan.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href="/my-finances">View Details</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             ) : (
                <p className="text-sm text-muted-foreground">No loan history to display.</p>
             )}
          </CardContent>
           <CardFooter>
                <Button variant="link" asChild>
                    <Link href="/my-finances">View All Loan History &rarr;</Link>
                </Button>
            </CardFooter>
        </Card>

    </div>
  );
}

    