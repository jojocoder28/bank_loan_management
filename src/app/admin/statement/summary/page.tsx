
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getStatementSummary } from "../actions";
import { ArrowLeft, Wallet, PiggyBank, HandCoins, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function StatementSummaryPage() {
  const summary = await getStatementSummary();
  const currentDate = new Date();
  const month = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const SummaryItem = ({ label, value, icon }: { label: string, value: number, icon: React.ReactNode }) => (
     <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">{icon}</div>
            <p className="font-medium text-lg">{label}</p>
        </div>
        <p className="font-bold text-xl">₹{value.toLocaleString()}</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
        <div className="mb-4">
            <Button asChild variant="outline">
                <Link href="/admin/statement">
                    <ArrowLeft className="mr-2" />
                    Back to Full Statement
                </Link>
            </Button>
        </div>
        <Card>
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">Summary for the month of {month}, {year}</CardTitle>
                <CardDescription>A high-level overview of the total deductions for the current month.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <SummaryItem label="Thrift Fund(TF)" value={summary.totalThrift} icon={<Wallet className="size-6 text-primary" />} />
                <SummaryItem label="Share Fund(SF)" value={summary.totalShare} icon={<PiggyBank className="size-6 text-primary" />} />
                <SummaryItem label="Own Loan Principal" value={summary.totalLoanPrincipal} icon={<HandCoins className="size-6 text-primary" />} />
                <SummaryItem label="Own Loan Interest" value={summary.totalLoanInterest} icon={<Landmark className="size-6 text-primary" />} />

                 <div className="flex items-center justify-between p-6 rounded-lg bg-primary text-primary-foreground mt-6">
                    <p className="font-bold text-2xl">Total Deduction</p>
                    <p className="font-bold text-3xl">₹{summary.grandTotal.toLocaleString()}</p>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
