
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

// NOTE: Dummy data has been removed. This page should be connected to real user data.

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
                <CardTitle>Active Loan Overview</CardTitle>
                <CardDescription>
                  Your loan status will appear here.
                </CardDescription>
              </div>
            </div>
             <Button asChild>
                <Link href="/apply-loan">Apply for Loan <ArrowRight className="ml-2" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-6">
             <div className="text-center text-muted-foreground py-8">
              <p>No active loan data to display.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your Funds</CardTitle>
            <CardDescription>Your fund balances will appear here.</CardDescription>
          </CardHeader>
           <CardContent className="flex flex-col gap-4">
             <div className="text-center text-muted-foreground py-8">
              <p>No fund data to display.</p>
            </div>
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
                <div className="text-center text-muted-foreground py-8">
                    <p>No transactions to display.</p>
                </div>
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
