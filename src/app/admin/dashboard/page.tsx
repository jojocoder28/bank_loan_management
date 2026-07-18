import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  ShieldCheck, 
  Users, 
  FileCheck, 
  Landmark, 
  HandCoins, 
  UserCheck, 
  UserCog, 
  Coins, 
  Wallet, 
  TrendingUp, 
  PiggyBank
} from 'lucide-react';
import Link from 'next/link';
import { getAdminStats } from './actions';
import { AdminDashboardCharts } from './_components/admin-dashboard-charts';

const adminFeatures = [
    {
        title: "Approvals",
        description: "Review membership and loan applications.",
        href: "/admin/approvals",
        icon: <FileCheck className="size-8 text-primary" />
    },
    {
        title: "User Management",
        description: "View and manage all registered user accounts.",
        href: "/admin/users",
        icon: <Users className="size-8 text-primary" />
    },
    {
        title: "AI Financial Auditor",
        description: "Run anomaly detection on financial data.",
        href: "/admin/audit",
        icon: <ShieldCheck className="size-8 text-primary" />
    },
]

export default async function AdminDashboardPage() {
    const stats = await getAdminStats();

    const formatCurrency = (val: number) => `₹${val.toLocaleString()}`;

    return (
      <div className="flex flex-col gap-8 pb-12">
        {/* Hero Section with Backdrop */}
        <div className="relative -mx-4 sm:-mx-8 -mt-8 pt-8 pb-12 px-4 sm:px-8 overflow-hidden bg-primary/5 border-b">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
          {/* Abstract background shapes */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 -left-12 w-64 h-64 bg-accent/10 rounded-full blur-2xl opacity-50" />
          
          <div className="relative z-10 max-w-4xl">
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: "Sora, sans-serif" }}>
              Admin Control Panel
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-lg">
              Welcome, Admin. Monitor financial health, approve applications, and manage the cooperative society's overall performance.
            </p>
          </div>
        </div>

        {/* Primary Financial Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: "Total Borrowed Capital",
              val: formatCurrency(stats.totalBorrowedCapital),
              desc: "Active & paid loan principal",
              icon: Coins,
              bg: "from-blue-500/10 to-indigo-500/5 border-blue-500/20",
              iconColor: "text-blue-500",
            },
            {
              title: "Total Interest Earned",
              val: formatCurrency(stats.totalInterestEarned),
              desc: "From all historical payments",
              icon: TrendingUp,
              bg: "from-emerald-500/10 to-teal-500/5 border-emerald-500/20",
              iconColor: "text-emerald-500",
            },
            {
              title: "Total System Funds",
              val: formatCurrency(stats.totalSystemFunds),
              desc: "Share, Thrift & Guaranteed",
              icon: PiggyBank,
              bg: "from-purple-500/10 to-violet-500/5 border-purple-500/20",
              iconColor: "text-purple-500",
            },
          ].map((c, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-5 border bg-gradient-to-br ${c.bg} flex items-center justify-between shadow-sm`}
            >
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  {c.title}
                </p>
                <p
                  className="stat-number text-2xl font-extrabold leading-none"
                  style={{ fontFamily: "Sora, sans-serif" }}
                >
                  {c.val}
                </p>
                <p className="text-[11px] text-muted-foreground">{c.desc}</p>
              </div>
              <div className="size-11 rounded-xl bg-background/60 border flex items-center justify-center shrink-0">
                <c.icon className={`size-5 ${c.iconColor}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Recharts Analytics Section */}
        <AdminDashboardCharts 
            loansByStatus={stats.loansByStatus} 
            recentLoansTrend={stats.recentLoansTrend} 
        />

        {/* Secondary Operational Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
                    <Landmark className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.activeLoans}</div></CardContent>
            </Card>
            <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Loans</CardTitle>
                    <HandCoins className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.pendingLoans}</div></CardContent>
            </Card>
            <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
                    <Landmark className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.totalLoans}</div></CardContent>
            </Card>
            <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Members</CardTitle>
                    <UserCheck className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.totalMembers}</div></CardContent>
            </Card>
            <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Board Members</CardTitle>
                    <UserCog className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.totalBoardMembers}</div></CardContent>
            </Card>
            <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.totalUsers}</div></CardContent>
            </Card>
        </div>

        {/* Action Panels */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {adminFeatures.map((feature) => (
              <Card key={feature.title} className="flex flex-col group hover:shadow-md transition-all duration-300 glass-card">
                  <CardHeader className="flex-1">
                      <div className="bg-primary/10 p-3 rounded-xl w-fit mb-4 group-hover:scale-105 transition-transform">
                          {feature.icon}
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Link href={feature.href} className="text-sm font-semibold text-primary group-hover:underline flex items-center gap-1">
                          Go to {feature.title} <TrendingUp className="size-3" />
                      </Link>
                  </CardContent>
              </Card>
          ))}
        </div>
      </div>
    );
}
