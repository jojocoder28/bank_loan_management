"use client";

import React from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AdminChartsProps {
  loansByStatus: { name: string; value: number; fill: string }[];
  recentLoansTrend: { month: string; applications: number }[];
}

export function AdminDashboardCharts({ loansByStatus, recentLoansTrend }: AdminChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Recent Loans Trend Bar Chart */}
      <Card className="lg:col-span-2 glass-card border-none">
        <CardHeader>
          <CardTitle className="text-lg font-bold" style={{ fontFamily: "Sora, sans-serif" }}>
            Loan Application Trend
          </CardTitle>
          <CardDescription>Volume of applications over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={recentLoansTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="barColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  color: "hsl(var(--card-foreground))",
                }}
                itemStyle={{ fontSize: "12px", color: "hsl(var(--card-foreground))" }}
                labelStyle={{ fontSize: "12px", fontWeight: "bold" }}
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
              />
              <Bar 
                dataKey="applications" 
                name="Applications" 
                fill="url(#barColor)" 
                radius={[4, 4, 0, 0]} 
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Loans By Status Pie Chart */}
      <Card className="glass-card border-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Loan Portfolio Status
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[280px] flex items-center justify-center">
          {loansByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={loansByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {loansByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    color: "hsl(var(--card-foreground))",
                  }}
                  itemStyle={{ fontSize: "12px", color: "hsl(var(--card-foreground))" }}
                />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex flex-col items-center justify-center text-muted-foreground h-full space-y-2">
                <span className="text-sm">No loan data available</span>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
