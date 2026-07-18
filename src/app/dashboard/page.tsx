
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
    UserCheck,
    Wallet,
    Handshake,
    HeartHandshake,
    StepForward,
    Target,
    HelpCircle,
    Mail,
    Users,
    Phone
} from 'lucide-react';
import { cn } from "@/lib/utils";
import Link from 'next/link';
import { getDashboardData, getBoardMembers } from './actions';
import { redirect } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { getBenefits, getBanners } from '@/app/admin/homepage/actions';
import { DashboardBanners } from './_components/dashboard-banners';
import { UserDashboardCharts } from './_components/user-dashboard-charts';

const IconMap: Record<string, React.ComponentType<any>> = {
  TrendingUp,
  UserCheck,
  Landmark,
  Award,
  Handshake,
  PiggyBank,
  HeartHandshake,
  Users,
  ShieldCheck,
  Mail,
  HelpCircle,
};



const offerings = [
    { title: "Secure & Fair Loans", description: "Access loans at competitive interest rates with transparent terms.", icon: <Handshake className="size-8 text-primary" /> },
    { title: "Savings & Growth", description: "Grow your savings with Share, Guaranteed, and Thrift funds.", icon: <PiggyBank className="size-8 text-primary" /> },
    { title: "Community & Support", description: "Be part of a supportive community of fellow teachers.", icon: <HeartHandshake className="size-8 text-primary" /> },
]

const steps = [
    { title: "Fill Out the Form", description: "Complete the simple online membership application with your details.", icon: <StepForward className="size-8 text-primary" /> },
    { title: "Admin Review", description: "Our team will review your application for approval.", icon: <UserCheck className="size-8 text-primary" /> },
    { title: "Become a Member", description: "Once approved, you'll have full access to all member benefits and services.", icon: <Target className="size-8 text-primary" /> },
]


const UserLandingPage = ({ benefits, banners }: { benefits: any[], banners: any[] }) => {
    return (
        <div className="flex flex-col gap-12 md:gap-20">
            <DashboardBanners banners={banners} />
            {/* Hero Section */}
            <section className="text-center">
                <div className="max-w-3xl mx-auto py-12 md:py-20">
                    <Badge variant="outline" className="mb-4">For Teachers, By Teachers</Badge>
                    <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tighter text-primary">A Financial Cooperative You Can Trust</h1>
                    <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                        Join the Sarisha & Khorda G P Primary School Teachers Co Operative Credit Society LTD. We provide exclusive financial products and community benefits, built on trust and mutual growth.
                    </p>
                    <Button asChild size="lg" className="mt-8">
                        <Link href="/become-member">Become a Member Today <ArrowRight className="ml-2" /></Link>
                    </Button>
                </div>
            </section>

            {/* Offerings Section */}
            <section>
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">Our Core Offerings</h2>
                    <p className="text-muted-foreground mt-2">Services built for the financial well-being of our members.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {offerings.map(item => (
                        <Card key={item.title} className="text-center hover:shadow-lg transition-shadow duration-300">
                            <CardHeader className="items-center">
                                <div className="bg-primary/10 p-4 rounded-full mb-4">
                                    {item.icon}
                                </div>
                                <CardTitle>{item.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{item.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>


            {/* Benefits Section */}
            <section>
                <div className="grid md:grid-cols-2 gap-8 items-center bg-card p-8 rounded-lg shadow-sm border">
                    <div className="space-y-6">
                        <h2 className="text-3xl md:text-4xl font-bold">Exclusive Membership Benefits</h2>
                        <p className="text-muted-foreground text-lg">As a member, you're not just a customer; you're an owner. Enjoy a range of perks designed to reward you and build our community.</p>
                        <div className="grid sm:grid-cols-2 gap-4 pt-4">
                            {benefits.map(benefit => {
                                const BenefitIcon = IconMap[benefit.icon] || HelpCircle;
                                return (
                                    <div key={benefit.title} className="relative group rounded-xl p-[1px] bg-gradient-to-br from-primary/10 via-border/50 to-primary/5 hover:from-primary/40 hover:to-accent/30 transition-all duration-300">
                                      <div className="bg-card rounded-[11px] p-4 space-y-3 h-full flex flex-col justify-between">
                                        <div className="space-y-3">
                                            <div className="bg-primary/10 p-2.5 rounded-lg border border-primary/20 text-primary w-fit group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105 transition-all duration-300 shadow-sm">
                                                <BenefitIcon className="size-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{benefit.title}</h4>
                                                <p className="text-xs text-muted-foreground leading-normal mt-1">{benefit.description}</p>
                                            </div>
                                        </div>
                                      </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="h-[400px] w-full bg-secondary/30 rounded-lg flex items-center justify-center p-4 overflow-hidden relative" data-ai-hint="community people">
                        {/* Abstract CSS art for community */}
                        <div className="absolute w-40 h-80 rounded-full bg-primary/20 -bottom-10 -left-10"></div>
                        <div className="absolute w-56 h-96 rounded-full bg-accent/80 -top-20 -right-20"></div>
                        <div className="relative flex items-end gap-2 isolate">
                            {/* Person 1 */}
                            <div className="relative flex flex-col items-center">
                                <div className="h-16 w-16 rounded-full bg-primary/30 backdrop-blur-sm border border-white/10"></div>
                                <div className="h-28 w-24 rounded-t-full bg-primary/30 backdrop-blur-sm border border-white/10 -mt-2"></div>
                            </div>
                            {/* Person 2 (Center) */}
                            <div className="relative flex flex-col items-center bottom-6 z-10">
                                <div className="h-20 w-20 rounded-full bg-primary/50 backdrop-blur-sm border border-white/10"></div>
                                <div className="h-40 w-28 rounded-t-full bg-primary/50 backdrop-blur-sm border border-white/10 -mt-2"></div>
                            </div>
                            {/* Person 3 */}
                            <div className="relative flex flex-col items-center">
                                <div className="h-16 w-16 rounded-full bg-primary/30 backdrop-blur-sm border border-white/10"></div>
                                <div className="h-28 w-24 rounded-t-full bg-primary/30 backdrop-blur-sm border border-white/10 -mt-2"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How to Join Section */}
            <section className="py-12 md:py-20">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">Ready to Join?</h2>
                    <p className="text-muted-foreground mt-2">Becoming a member is simple. Here's how it works.</p>
                </div>
                <div className="relative">
                    {/* The connecting line */}
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 hidden md:block"></div>

                    <div className="grid md:grid-cols-3 gap-12 md:gap-8 text-center relative">
                        {steps.map((step, index) => (
                            <div key={step.title} className="flex flex-col items-center bg-background px-4">
                                <div className="flex items-center justify-center size-16 rounded-full bg-primary/10 border-2 border-primary mb-4">
                                    {step.icon}
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{index + 1}. {step.title}</h3>
                                <p className="text-muted-foreground">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="text-center mt-12">
                    <Button asChild size="lg">
                        <Link href="/become-member">Start Your Application <ArrowRight className="ml-2" /></Link>
                    </Button>
                </div>
            </section>
        </div>
    )
}


export default async function DashboardPage() {
    const data = await getDashboardData();

    if (!data) {
        redirect('/login');
    }

    const { user, activeLoans, loanHistory } = data;

    const benefits = await getBenefits(true);
    const banners = await getBanners(true);
    const boardMembers = await getBoardMembers();

    // If the user is not a member, show the landing page.
    if (user.role === 'user') {
        return <UserLandingPage benefits={benefits} banners={banners} />;
    }

    const loanStatusVariant: { [key: string]: "default" | "secondary" | "outline" | "destructive" } = {
        active: 'default',
        paid: 'secondary',
        pending: 'outline',
        rejected: 'destructive'
    }

    return (
        <div className="flex flex-col gap-8 pb-12">
            {/* Hero Section with Backdrop */}
            <div className="relative -mx-4 sm:-mx-8 -mt-8 pt-8 pb-12 px-4 sm:px-8 overflow-hidden bg-primary/5 border-b">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50" />
              <div className="absolute bottom-0 -left-12 w-64 h-64 bg-accent/10 rounded-full blur-2xl opacity-50" />
              
              <div className="relative z-10 max-w-4xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: "Sora, sans-serif" }}>
                    Welcome back, {user.name}
                  </h1>
                  <p className="text-muted-foreground mt-2 max-w-2xl text-lg">
                    Here is an overview of your active loans, funds, and membership benefits.
                  </p>
                </div>
                <Button asChild size="lg" className="shrink-0 w-full sm:w-auto">
                    <Link href="/apply-loan">Apply for New Loan <ArrowRight className="ml-2 size-4" /></Link>
                </Button>
              </div>
            </div>

            <DashboardBanners banners={banners} />

            {/* Main Interactive Charts Section */}
            <UserDashboardCharts 
                user={user} 
                activeLoans={activeLoans} 
                loanHistory={loanHistory} 
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1 glass-card">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                            <UserCheck className="size-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Membership Status</CardTitle>
                            <CardDescription>Your current role and status.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                            <p className="font-medium">Role</p>
                            <Badge variant="outline" className="capitalize">{user.role.replace('_', ' ')}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                            <p className="font-medium">Membership ID</p>
                            <Badge variant="outline">{user.membershipNumber || 'N/A'}</Badge>
                        </div>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2 glass-card">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                            <Award className="size-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Membership Benefits</CardTitle>
                            <CardDescription>Annual perks for all members.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-4 text-sm md:grid-cols-2">
                        {benefits.map(benefit => (
                            <div key={benefit.title} className="relative group rounded-xl p-[1px] bg-gradient-to-br from-primary/10 via-border/50 to-primary/5 hover:from-primary/40 hover:to-accent/30 transition-all duration-300">
                              <div className="bg-card/90 rounded-[11px] p-5 flex flex-col gap-2 h-full text-left">
                                <p className="font-bold text-foreground group-hover:text-primary transition-colors">{benefit.title}</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">{benefit.description}</p>
                              </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Recent Loan History</CardTitle>
                    <CardDescription>
                        Your last 5 loan applications.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loanHistory.length > 0 ? (
                        <div className="w-full overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Applied On</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loanHistory.map(loan => (
                                        <TableRow key={String(loan._id)}>
                                            <TableCell suppressHydrationWarning>{new Date(loan.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell>₹{loan.loanAmount.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge variant={loanStatusVariant[loan.status]} className="capitalize">{loan.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href="/my-finances">View Details</Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No loan history to display.</p>
                    )}
                </CardContent>
                <CardFooter>
                    <Button variant="link" asChild>
                        <Link href="/my-finances">View All Loan History &rarr;</Link>
                    </Button>
                </CardFooter>
            </Card>

            {/* Board Members Directory Section */}
            {boardMembers.length > 0 && (
                <Card className="border-primary/10 shadow-md glass-card">
                    <CardHeader className="flex flex-row items-center gap-4 border-b pb-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                            <Users className="size-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold">Board Members Directory</CardTitle>
                            <CardDescription>
                                Contact details of the active cooperative society governing board.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {boardMembers.map((member) => (
                                <div 
                                    key={member._id} 
                                    className="relative group rounded-2xl p-[1px] bg-gradient-to-br from-primary/5 via-border/50 to-primary/5 hover:from-primary/20 hover:to-accent/20 transition-all duration-300 shadow-sm"
                                >
                                    <div className="bg-card rounded-[15px] p-5 flex flex-col items-center text-center h-full space-y-4">
                                        {/* Avatar / Photo */}
                                        <div className="relative h-20 w-20 rounded-full border-2 border-primary/20 overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-300">
                                            {member.photoUrl ? (
                                                <Image 
                                                    src={member.photoUrl} 
                                                    alt={member.name} 
                                                    fill 
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full bg-primary/10 text-primary font-bold flex items-center justify-center text-2xl uppercase">
                                                    {member.name?.[0] || 'B'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Name & Role */}
                                        <div className="space-y-1">
                                            <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                                                {member.name}
                                            </h3>
                                            <Badge variant="secondary" className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">
                                                Board Member
                                            </Badge>
                                        </div>

                                        <Separator className="w-full" />

                                        {/* Contact Info */}
                                        <div className="w-full space-y-2 text-sm text-left">
                                            {member.phone && (
                                                <a 
                                                    href={`tel:${member.phone}`} 
                                                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors truncate"
                                                >
                                                    <Phone className="size-4 shrink-0 text-muted-foreground/75" />
                                                    <span className="truncate">{member.phone}</span>
                                                </a>
                                            )}
                                            {member.email && (
                                                <a 
                                                    href={`mailto:${member.email}`} 
                                                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors truncate"
                                                >
                                                    <Mail className="size-4 shrink-0 text-muted-foreground/75" />
                                                    <span className="truncate">{member.email}</span>
                                                </a>
                                            )}
                                            {!member.phone && !member.email && (
                                                <span className="text-xs text-muted-foreground italic block text-center">
                                                    No contact details provided
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

        </div>
    );
}
