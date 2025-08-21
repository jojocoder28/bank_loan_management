
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
} from 'lucide-react';
import { cn } from "@/lib/utils";
import Link from 'next/link';

const memberData = {
  loan: {
    isActive: true,
    principal: 100000,
    paid: 40000,
    interestRate: 10, // Monthly
    nextPaymentDate: '2024-08-01',
    nextPaymentAmount: 10000, // Principal only, interest is separate
    termMonths: 60,
    paidMonths: 24,
  },
  funds: {
    shareCapital: 7500,
    guaranteedFund: 6000,
    thriftFund: 24000,
  },
  transactions: [
    {
      id: 'txn_1',
      date: '2024-07-15',
      description: 'Monthly Interest Payment',
      amount: -600, // (100000 - 40000) * 10%
      type: 'debit',
    },
    {
      id: 'txn_2',
      date: '2024-07-15',
      description: 'Loan Principal Payment',
      amount: -2500,
      type: 'debit',
    },
    {
      id: 'txn_3',
      date: '2024-07-10',
      description: 'Thrift Fund Deposit',
      amount: 1000,
      type: 'credit',
    },
    {
      id: 'txn_4',
      date: '2024-06-15',
      description: 'Monthly Interest Payment',
      amount: -625,
      type: 'debit',
    },
     {
      id: 'txn_5',
      date: '2024-06-15',
      description: 'Loan Principal Payment',
      amount: -2500,
      type: 'debit',
    },
  ],
};

const fundBalances = [
  {
    name: 'Share Fund',
    amount: memberData.funds.shareCapital,
    icon: <CircleDollarSign className="size-6 text-accent-foreground" />,
    description: "Collateral & Dividends",
  },
  {
    name: 'Guaranteed Fund',
    amount: memberData.funds.guaranteedFund,
    icon: <ShieldCheck className="size-6 text-accent-foreground" />,
    description: "Earns 6% p.a. interest",
  },
  {
    name: 'Thrift Fund',
    amount: memberData.funds.thriftFund,
    icon: <PiggyBank className="size-6 text-accent-foreground" />,
    description: "Monthly savings (Rs. 1000)",
  },
];


export default function DashboardPage() {
  const loanProgress = memberData.loan.isActive ? (memberData.loan.paid / memberData.loan.principal) * 100 : 0;
  const remainingPrincipal = memberData.loan.principal - memberData.loan.paid;

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
                <CardTitle>Active Loan Overview</CardTitle>
                <CardDescription>
                  {memberData.loan.isActive ? `Loan of Rs. ${memberData.loan.principal.toLocaleString()}` : "No active loans"}
                </CardDescription>
              </div>
            </div>
             <Button asChild>
                <Link href="/apply-loan">Apply for Loan <ArrowRight className="ml-2" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Principal Paid</span>
                <span>Rs. {memberData.loan.paid.toLocaleString()} / Rs. {memberData.loan.principal.toLocaleString()}</span>
              </div>
              <Progress value={loanProgress} aria-label={`${loanProgress.toFixed(0)}% of loan paid`} />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
               <div className="flex flex-col gap-1 p-3 bg-secondary/50 rounded-md">
                <span className="text-muted-foreground">Remaining Principal</span>
                <span className="font-semibold text-lg">Rs. {remainingPrincipal.toLocaleString()}</span>
              </div>
               <div className="flex flex-col gap-1 p-3 bg-secondary/50 rounded-md">
                <span className="text-muted-foreground">Next Principal Payment</span>
                <span className="font-semibold text-lg">Rs. {memberData.loan.nextPaymentAmount.toLocaleString()}</span>
              </div>
               <div className="flex flex-col gap-1 p-3 bg-secondary/50 rounded-md">
                <span className="text-muted-foreground">Monthly Interest</span>
                <span className="font-semibold text-lg">{memberData.loan.interestRate}%</span>
              </div>
               <div className="flex flex-col gap-1 p-3 bg-secondary/50 rounded-md">
                <span className="text-muted-foreground">Next Payment Date</span>
                <span className="font-semibold flex items-center gap-2">
                  <Calendar className="size-4" /> {new Date(memberData.loan.nextPaymentDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your Funds</CardTitle>
            <CardDescription>Balances across all funds.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {fundBalances.map((fund) => (
              <div key={fund.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-accent/20">{fund.icon}</div>
                  <div>
                    <span className="font-medium">{fund.name}</span>
                     <p className="text-xs text-muted-foreground">{fund.description}</p>
                  </div>
                </div>
                <span className="font-semibold text-lg">
                  Rs. {fund.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
                <History className="size-6 text-primary" />
            </div>
            <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Your recent account activity.</CardDescription>
            </div>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount (Rs.)</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {memberData.transactions.map((tx) => (
                    <TableRow key={tx.id}>
                    <TableCell className="font-medium">{new Date(tx.date).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell className="text-right">
                        <Badge
                        variant={tx.type === 'credit' ? 'default' : 'destructive'}
                        className={cn(
                            tx.type === 'credit'
                            ? 'bg-green-600/20 text-green-500'
                            : 'bg-red-600/20 text-red-500',
                            'font-mono'
                        )}
                        >
                        {tx.type === 'credit' ? '+' : ''}
                        {tx.amount.toLocaleString('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            minimumFractionDigits: 2,
                        })}
                        </Badge>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
                <Award className="size-6 text-primary" />
            </div>
            <div>
                <CardTitle>Membership Benefits</CardTitle>
                <CardDescription>Annual perks for all members.</CardDescription>
            </div>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <p className="font-medium">Annual Durga Puja Dividend</p>
                    <Badge variant="outline">10-12% on Share Fund</Badge>
                </div>
                 <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <p className="font-medium">One-Day Picnic</p>
                    <Badge variant="outline">Fully Bank-Sponsored</Badge>
                </div>
                 <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <p className="font-medium">Annual Tour Support</p>
                    <Badge variant="outline">Contribution from Profits</Badge>
                </div>
                 <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <p className="font-medium">Yearly Gift</p>
                    <Badge variant="outline">From Bank Profits</Badge>
                </div>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
