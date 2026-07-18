"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Award, Wallet, Clock, Activity } from "lucide-react";
import { ILoan } from "@/models/loan";

interface UserDashboardChartsProps {
  user: {
    shareFund: number;
    guaranteedFund: number;
    thriftFund?: number;
  };
  activeLoans: ILoan[];
  loanHistory: ILoan[];
}

export function UserDashboardCharts({
  user,
  activeLoans,
  loanHistory,
}: UserDashboardChartsProps) {
  const formatCurrency = (val: number) => `₹${val.toLocaleString()}`;

  // 1. Funds Pie Chart Data
  const fundData = [
    { name: "Share Fund", value: user.shareFund, color: "#2563eb" },
    { name: "Thrift Fund", value: user.thriftFund || 0, color: "#10b981" },
    { name: "Guaranteed Fund", value: user.guaranteedFund, color: "#f43f5e" },
  ].filter((f) => f.value > 0);

  const COLORS = ["#3b82f6", "#10b981", "#f43f5e"];

  // 2. Active Loans Progress Calculation
  const totalLoanAmount = activeLoans.reduce((sum, loan) => sum + loan.loanAmount, 0);
  const totalPrincipalLeft = activeLoans.reduce((sum, loan) => sum + loan.principal, 0);
  const totalPaid = totalLoanAmount - totalPrincipalLeft;
  const loanProgress = totalLoanAmount > 0 ? (totalPaid / totalLoanAmount) * 100 : 0;

  // 3. Historical Loan Sizes Bar Chart
  const historyData = [...activeLoans, ...loanHistory]
    .slice(0, 5)
    .reverse()
    .map((loan, idx) => ({
      name: `Loan ${idx + 1}`,
      Amount: loan.loanAmount,
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Overview Metric & Progress */}
      <Card className="lg:col-span-2 glass-card border-none flex flex-col justify-between">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="size-5 text-primary" />
            <CardTitle className="text-lg font-bold" style={{ fontFamily: "Sora, sans-serif" }}>
              Active Repayment Progress
            </CardTitle>
          </div>
          <CardDescription>Your combined active loan timeline</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {totalLoanAmount > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Borrowed</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(totalLoanAmount)}</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Already Paid</p>
                  <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPaid)}</p>
                </div>
              </div>
              <div className="space-y-2 pt-4">
                <div className="flex justify-between text-sm font-medium">
                  <span>Repayment Completion</span>
                  <span>{loanProgress.toFixed(1)}%</span>
                </div>
                <Progress value={loanProgress} className="h-3" />
                <p className="text-xs text-muted-foreground text-right">
                  {formatCurrency(totalPrincipalLeft)} remaining
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-10 space-y-3">
              <Award className="size-10 text-muted-foreground/30" />
              <p>You have no active loans.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Funds Pie Chart */}
      <Card className="glass-card border-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Wallet className="size-4" /> Personal Funds
          </CardTitle>
        </CardHeader>
        <CardContent className="h-60 flex items-center justify-center">
          {fundData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fundData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {fundData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), undefined]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    color: "hsl(var(--card-foreground))",
                  }}
                  itemStyle={{ fontSize: "12px", color: "hsl(var(--card-foreground))" }}
                />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "15px" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex flex-col items-center justify-center text-muted-foreground h-full">
                <span className="text-sm">No funds found</span>
             </div>
          )}
        </CardContent>
      </Card>

      {/* Historical Loan Sizes */}
      {historyData.length > 0 && (
        <Card className="lg:col-span-3 glass-card border-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-primary" />
              <CardTitle className="text-lg font-bold" style={{ fontFamily: "Sora, sans-serif" }}>
                Loan History Timeline
              </CardTitle>
            </div>
            <CardDescription>Sizes of your recent loan applications</CardDescription>
          </CardHeader>
          <CardContent className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="historyBarColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), "Amount"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    color: "hsl(var(--card-foreground))",
                  }}
                  itemStyle={{ fontSize: "12px", color: "hsl(var(--card-foreground))" }}
                  labelStyle={{ fontSize: "12px", fontWeight: "bold", color: "hsl(var(--card-foreground))" }}
                  cursor={{ fill: "rgba(0,0,0,0.05)" }}
                />
                <Bar 
                  dataKey="Amount" 
                  fill="url(#historyBarColor)" 
                  radius={[4, 4, 0, 0]} 
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
