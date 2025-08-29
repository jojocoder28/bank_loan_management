
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ShieldCheck, Users, Activity, FileCheck, Landmark, HandCoins, UserCheck, UserCog } from 'lucide-react';
import Link from 'next/link';
import { getAdminStats, AdminStats } from './actions';


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

const StatCard = ({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);


export default async function AdminDashboardPage() {
    const stats = await getAdminStats();

  return (
    <div className="grid gap-8">
        <Card>
            <CardHeader>
                <CardTitle>Admin Control Panel</CardTitle>
                <CardDescription>
                    Welcome, Admin. Access and manage the core features of the Sarisha & Khorda G P Primary School Teachers Co Operative Credit Society LTD.
                </CardDescription>
            </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Active Loans" value={stats.activeLoans} icon={<Landmark className="size-4 text-muted-foreground" />} />
            <StatCard title="Pending Loans" value={stats.pendingLoans} icon={<HandCoins className="size-4 text-muted-foreground" />} />
            <StatCard title="Total Loans" value={stats.totalLoans} icon={<Landmark className="size-4 text-muted-foreground" />} />
            <StatCard title="Members" value={stats.totalMembers} icon={<UserCheck className="size-4 text-muted-foreground" />} />
            <StatCard title="Board Members" value={stats.totalBoardMembers} icon={<UserCog className="size-4 text-muted-foreground" />} />
            <StatCard title="Total Users" value={stats.totalUsers} icon={<Users className="size-4 text-muted-foreground" />} />
        </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {adminFeatures.map((feature) => (
             <Card key={feature.title} className="flex flex-col">
                <CardHeader className="flex-1">
                    <div className='pb-4'>{feature.icon}</div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href={feature.href} className="text-sm font-medium text-primary hover:underline">
                        Go to {feature.title} &rarr;
                    </Link>
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
}
