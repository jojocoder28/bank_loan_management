
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, TrendingDown, FileText, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { getProfitLossData, ProfitLossData } from "./actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton";


export default function ProfitLossPage() {
    const [range, setRange] = useState('ytd');
    const [isPending, startTransition] = useTransition();
    const [data, setData] = useState<ProfitLossData | null>(null);

    useEffect(() => {
        startTransition(async () => {
            const result = await getProfitLossData(range);
            setData(result);
        })
    }, [range]);


    const netProfit = (data?.totalIncome ?? 0) - (data?.totalExpense ?? 0);
    const netProfitClass = netProfit >= 0 ? 'text-green-500' : 'text-destructive';

  return (
    <div className="grid gap-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 />
                    Profit & Loss Statement
                </CardTitle>
                <CardDescription>
                    An overview of the bank's income and expenses.
                </CardDescription>
            </div>
             <div className="flex items-center gap-2">
                <CalendarIcon className="size-4 text-muted-foreground" />
                <Select value={range} onValueChange={setRange} disabled={isPending}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ytd">Year to Date</SelectItem>
                    <SelectItem value="mtd">Month to Date</SelectItem>
                    <SelectItem value="last_month">Last Month</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
            </div>
        </CardHeader>
      </Card>
      
      {isPending ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
      ) : data ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="size-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{data.totalIncome.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Accrued interest from active loans</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="size-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{data.totalExpense.toLocaleString()}</div>
               <p className="text-xs text-muted-foreground">Accrued interest on thrift funds</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit / Loss</CardTitle>
               <FileText className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netProfitClass}`}>₹{netProfit.toLocaleString()}</div>
               <p className="text-xs text-muted-foreground">Income minus expenses</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

        <Card>
            <CardHeader>
                <CardTitle>Details</CardTitle>
                <CardDescription>Breakdown of income and expense sources for the selected period.</CardDescription>
            </CardHeader>
            <CardContent>
                 {isPending ? (
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                ) : data ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow className="font-bold bg-secondary/50">
                            <TableCell>Income</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                <div className="pl-4">Loan Interest (Accrued)</div>
                                <p className="pl-4 text-xs text-muted-foreground">Interest generated by all active loans within the period.</p>
                            </TableCell>
                            <TableCell className="text-right font-medium">₹{data.incomeDetails.loanInterest.toLocaleString()}</TableCell>
                        </TableRow>
                        <TableRow className="font-bold bg-secondary/50">
                            <TableCell>Expenses</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                         <TableRow>
                            <TableCell>
                                <div className="pl-4">Thrift Fund Interest (Accrued)</div>
                                <p className="pl-4 text-xs text-muted-foreground">Interest liability for member's thrift fund deposits.</p>
                            </TableCell>
                            <TableCell className="text-right font-medium">₹{data.expenseDetails.thriftFundInterest.toLocaleString()}</TableCell>
                        </TableRow>
                    </TableBody>
                     <TableFooter>
                        <TableRow className="font-bold text-lg">
                            <TableCell>Net Profit / Loss</TableCell>
                            <TableCell className={`text-right ${netProfitClass}`}>₹{netProfit.toLocaleString()}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
                ) : (
                    <div className="text-center text-muted-foreground py-12">
                        <p>Select a date range to view the P&L statement.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
