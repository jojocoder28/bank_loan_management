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
import { Progress } from '@/components/ui/progress';
import {
  Landmark,
  PiggyBank,
  History,
  TrendingUp,
  CreditCard,
  Calendar,
} from 'lucide-react';

const fundBalances = [
  {
    name: 'Share Capital',
    amount: 5230.75,
    icon: <PiggyBank className="size-6 text-accent-foreground" />,
  },
  {
    name: 'Savings Deposit',
    amount: 12500.0,
    icon: <TrendingUp className="size-6 text-accent-foreground" />,
  },
  {
    name: 'Emergency Fund',
    amount: 2000.0,
    icon: <CreditCard className="size-6 text-accent-foreground" />,
  },
];

const transactions = [
  {
    id: 'txn_1',
    date: '2024-07-15',
    description: 'Loan Repayment - July',
    amount: -450.5,
    type: 'debit',
  },
  {
    id: 'txn_2',
    date: '2024-07-10',
    description: 'Savings Deposit',
    amount: 500.0,
    type: 'credit',
  },
  {
    id: 'txn_3',
    date: '2024-06-30',
    description: 'Dividend Payout',
    amount: 125.2,
    type: 'credit',
  },
  {
    id: 'txn_4',
    date: '2024-06-15',
    description: 'Loan Repayment - June',
    amount: -450.5,
    type: 'debit',
  },
  {
    id: 'txn_5',
    date: '2024-06-01',
    description: 'Emergency Fund Contribution',
    amount: 100.0,
    type: 'credit',
  },
];

export default function DashboardPage() {
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
                <CardTitle>Loan Overview</CardTitle>
                <CardDescription>Your current active loan status</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Progress</span>
                <span>$7,500 / $15,000</span>
              </div>
              <Progress value={50} aria-label="50% of loan paid" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Next Payment</span>
                <span className="font-semibold flex items-center gap-2">
                  <Calendar className="size-4" /> August 1, 2024
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Next Payment Amount</span>
                <span className="font-semibold">$450.50</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Interest Rate</span>
                <span className="font-semibold">5.25%</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Remaining Term</span>
                <span className="font-semibold">36 months</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Fund Balances</CardTitle>
            <CardDescription>Your contributions and savings.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {fundBalances.map((fund) => (
              <div key={fund.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-accent/20">{fund.icon}</div>
                  <span className="font-medium">{fund.name}</span>
                </div>
                <span className="font-semibold text-lg">
                  ${fund.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
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
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{tx.date}</TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={tx.type === 'credit' ? 'default' : 'destructive'}
                      className={cn(
                        tx.type === 'credit'
                          ? 'bg-accent/80 text-accent-foreground'
                          : 'bg-destructive/20 text-destructive',
                        'font-mono'
                      )}
                    >
                      {tx.type === 'credit' ? '+' : ''}
                      {tx.amount.toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      })}
                    </Badge>
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
