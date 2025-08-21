
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ShieldCheck, Users, Activity } from 'lucide-react';
import Link from 'next/link';

const adminFeatures = [
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
    {
        title: "System Activity",
        description: "Monitor real-time system logs and activities.",
        href: "#",
        icon: <Activity className="size-8 text-primary" />
    }
]


export default function AdminDashboardPage() {
  return (
    <div className="grid gap-8">
        <Card>
            <CardHeader>
                <CardTitle>Admin Control Panel</CardTitle>
                <CardDescription>
                    Welcome, Admin. Access and manage the core features of the Co-op Loan Manager.
                </CardDescription>
            </CardHeader>
        </Card>
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
