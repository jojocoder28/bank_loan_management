"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  Award,
  Wallet,
  Coins,
  ShieldCheck,
  TrendingDown,
  Percent,
} from "lucide-react";

interface ILoan {
  _id: string;
  loanAmount: number;
  principal: number;
  issueDate?: string | Date | null;
  status: string;
  payments: Array<{
    amount: number;
    date: string | Date;
    type: "principal" | "interest";
  }>;
}

interface FinancialChartsProps {
  user: {
    name: string;
    shareFund: number;
    thriftFund: number;
    guaranteedFund: number;
  };
  allLoans: ILoan[];
}

export function FinancialCharts({ user, allLoans }: FinancialChartsProps) {
  // 1. Calculations
  const activeLoans = allLoans.filter((l) => l.status === "active");
  const totalActivePrincipal = activeLoans.reduce((sum, l) => sum + l.principal, 0);

  // Sum all loan amounts
  const totalLoanAmount = allLoans
    .filter((l) => l.status === "active" || l.status === "paid")
    .reduce((sum, l) => sum + l.loanAmount, 0);

  // Sum paid principal
  let totalPaidPrincipal = 0;
  let totalPaidInterest = 0;

  allLoans.forEach((loan) => {
    if (loan.payments) {
      loan.payments.forEach((p) => {
        if (p.type === "principal") {
          totalPaidPrincipal += p.amount;
        } else if (p.type === "interest") {
          totalPaidInterest += p.amount;
        }
      });
    }
  });

  // Calculate overall payment score (credit score style: 85 - 100 base)
  const paymentScore =
    totalActivePrincipal === 0
      ? 100
      : Math.round(
          85 + (totalPaidPrincipal / (totalPaidPrincipal + totalActivePrincipal)) * 15
        );

  const getScoreRating = (score: number) => {
    if (score >= 95) return { label: "Excellent", color: "text-emerald-500" };
    if (score >= 90) return { label: "Very Good", color: "text-blue-500" };
    return { label: "Good", color: "text-amber-500" };
  };

  const rating = getScoreRating(paymentScore);

  // 2. Data formatting for Area Chart (Payment progress over time or per loan)
  // We construct data points from loans
  const chartData = allLoans
    .filter((l) => l.status === "active" || l.status === "paid")
    .slice(0, 6) // Last 6 loans for readability
    .reverse()
    .map((l, idx) => {
      const paid = l.loanAmount - l.principal;
      return {
        name: `Loan ${idx + 1}`,
        Applied: l.loanAmount,
        Paid: paid,
        Remaining: l.principal,
      };
    });

  // Fallback if no loan history
  const displayChartData =
    chartData.length > 0
      ? chartData
      : [
          { name: "No Data", Applied: 0, Paid: 0, Remaining: 0 },
        ];

  // 3. Data formatting for Pie Chart (Funds allocation)
  const fundData = [
    { name: "Share Fund", value: user.shareFund, color: "#2563eb" },
    { name: "Thrift Fund", value: user.thriftFund, color: "#10b981" },
    { name: "Guaranteed Fund", value: user.guaranteedFund, color: "#f43f5e" },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#f43f5e"];

  // Custom tooltips
  const formatCurrency = (val: any) => `₹${Number(val).toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* ── METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Total Borrowed Amount",
            val: totalLoanAmount,
            desc: "Active & completed principal",
            icon: Coins,
            bg: "from-blue-500/10 to-indigo-500/5 border-blue-500/20",
            iconColor: "text-blue-500",
          },
          {
            title: "Outstanding Balance",
            val: totalActivePrincipal,
            desc: "Current remaining principal",
            icon: TrendingDown,
            bg: "from-rose-500/10 to-pink-500/5 border-rose-500/20",
            iconColor: "text-rose-500",
          },
          {
            title: "Paid Interest",
            val: totalPaidInterest,
            desc: "Accumulated interest paid",
            icon: Percent,
            bg: "from-purple-500/10 to-violet-500/5 border-purple-500/20",
            iconColor: "text-purple-500",
          },
          {
            title: "Already Paid Principal",
            val: totalPaidPrincipal,
            desc: "Paid off outstanding loans",
            icon: TrendingUp,
            bg: "from-emerald-500/10 to-teal-500/5 border-emerald-500/20",
            iconColor: "text-emerald-500",
          },
        ].map((c, idx) => (
          <div
            key={idx}
            className={`rounded-2xl p-5 border bg-gradient-to-br ${c.bg} flex items-center justify-between card-lift`}
          >
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                {c.title}
              </p>
              <p
                className="stat-number text-2xl font-extrabold leading-none"
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                {formatCurrency(c.val)}
              </p>
              <p className="text-[11px] text-muted-foreground">{c.desc}</p>
            </div>
            <div className="size-11 rounded-xl bg-background/60 border flex items-center justify-center shrink-0">
              <c.icon className={`size-5 ${c.iconColor}`} />
            </div>
          </div>
        ))}
      </div>

      {/* ── CHARTS GRAPHIC SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Loan History Area Chart */}
        <Card className="lg:col-span-2 glass-card border-none">
          <CardHeader>
            <CardTitle className="text-lg font-bold" style={{ fontFamily: "Sora, sans-serif" }}>
              Loan Principle Overview
            </CardTitle>
            <CardDescription>Visual comparison of applied, paid, and outstanding values</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="appliedColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="paidColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), undefined]}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid rgba(0,0,0,0.06)",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  }}
                  itemStyle={{ fontSize: "12px" }}
                  labelStyle={{ fontSize: "12px", fontWeight: "bold" }}
                />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Area name="Applied Principal" type="monotone" dataKey="Applied" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#appliedColor)" />
                <Area name="Paid Principal" type="monotone" dataKey="Paid" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#paidColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Assets & Score Panel */}
        <div className="flex flex-col gap-6">
          {/* Credit Payment Score */}
          <Card className="glass-card border-none flex-1 flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold" style={{ fontFamily: "Sora, sans-serif" }}>
                Loan Payment Score
              </CardTitle>
              <CardDescription>Computed loan repayment health indicator</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6 gap-3">
              <div className="relative size-36 flex items-center justify-center">
                {/* Visual circular representation */}
                <svg className="size-full transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    stroke="hsl(var(--muted))"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    stroke="url(#scoreGradient)"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 60}
                    strokeDashoffset={
                      2 * Math.PI * 60 * (1 - paymentScore / 100)
                    }
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-extrabold text-foreground" style={{ fontFamily: "Sora, sans-serif" }}>
                    {paymentScore}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Score
                  </span>
                </div>
              </div>

              <div className="text-center space-y-0.5">
                <p className="text-sm font-semibold flex items-center gap-1.5 justify-center">
                  <Award className="size-4 text-emerald-500" /> Repayment Rating:{" "}
                  <span className={rating.color}>{rating.label}</span>
                </p>
                <p className="text-xs text-muted-foreground">Based on payments vs total liability</p>
              </div>
            </CardContent>
          </Card>

          {/* Allocation Breakdown */}
          <Card className="glass-card border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Fund Allocations
              </CardTitle>
            </CardHeader>
            <CardContent className="h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fundData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {fundData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatCurrency(value), undefined]} />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
