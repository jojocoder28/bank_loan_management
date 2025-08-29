
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
  Target
} from 'lucide-react';
import { cn } from "@/lib/utils";
import Link from 'next/link';
import { getDashboardData } from './actions';
import { redirect } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

const benefits = [
    { title: "Annual Durga Puja Dividend", description: "10-12% on Share Fund", icon: <TrendingUp className="size-6 text-primary"/> },
    { title: "One-Day Picnic", description: "Fully Self-Sponsored", icon: <UserCheck className="size-6 text-primary"/> },
    { title: "Annual Tour Support", description: "Contribution from Profits", icon: <Landmark className="size-6 text-primary"/> },
    { title: "Yearly Gift", description: "Yearly Gift", icon: <Award className="size-6 text-primary"/> },
]

const offerings = [
    { title: "Secure & Fair Loans", description: "Access loans at competitive interest rates with transparent terms.", icon: <Handshake className="size-8 text-primary"/> },
    { title: "Savings & Growth", description: "Grow your savings with Share, Guaranteed, and Thrift funds.", icon: <PiggyBank className="size-8 text-primary"/> },
    { title: "Community & Support", description: "Be part of a supportive community of fellow teachers.", icon: <HeartHandshake className="size-8 text-primary"/> },
]

const steps = [
    { title: "Fill Out the Form", description: "Complete the simple online membership application with your details.", icon: <StepForward className="size-8 text-primary"/> },
    { title: "Admin Review", description: "Our team will review your application for approval.", icon: <UserCheck className="size-8 text-primary"/> },
    { title: "Become a Member", description: "Once approved, you'll have full access to all member benefits and services.", icon: <Target className="size-8 text-primary"/> },
]


const UserLandingPage = () => {
    return (
        <div className="flex flex-col gap-12">
            {/* Hero Section */}
            <section className="text-center bg-card p-8 rounded-lg shadow-md">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">Unlock Your Financial Potential with Us</h1>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Welcome to the Sarisha & Khorda G P Primary School Teachers Co Operative Credit Society LTD. Join our community to access exclusive financial products and benefits designed just for you.
                    </p>
                    <Button asChild size="lg" className="mt-8">
                        <Link href="/become-member">Become a Member Today <ArrowRight className="ml-2"/></Link>
                    </Button>
                </div>
            </section>
            
             {/* Offerings Section */}
            <section>
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold">Our Core Offerings</h2>
                    <p className="text-muted-foreground">Services built for the financial well-being of our members.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {offerings.map(item => (
                        <Card key={item.title}>
                            <CardHeader className="items-center">
                                {item.icon}
                                <CardTitle>{item.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className="text-muted-foreground">{item.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>


            {/* Benefits Section */}
            <section>
                <div className="grid md:grid-cols-2 gap-8 items-center bg-card p-8 rounded-lg shadow-sm">
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold">Exclusive Membership Benefits</h2>
                        <p className="text-muted-foreground">As a member, you're not just a customer; you're an owner. Enjoy a range of perks designed to reward you and build our community.</p>
                        <div className="space-y-4 pt-4">
                            {benefits.map(benefit => (
                                <div key={benefit.title} className="flex items-center gap-4">
                                    {benefit.icon}
                                    <div>
                                        <h4 className="font-semibold">{benefit.title}</h4>
                                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="h-[300px] w-full bg-secondary/30 rounded-lg flex items-end justify-center p-4 overflow-hidden relative">
                       {/* People illustration */}
                       <div className="flex items-end gap-2 relative">
                            {/* Person 1 */}
                            <div className="relative flex flex-col items-center">
                                <div className="h-12 w-12 rounded-full bg-primary/20"></div>
                                <div className="h-24 w-20 rounded-t-full bg-primary/20"></div>
                            </div>
                             {/* Person 2 */}
                             <div className="relative flex flex-col items-center bottom-4">
                                <div className="h-16 w-16 rounded-full bg-primary/40"></div>
                                <div className="h-32 w-24 rounded-t-full bg-primary/40"></div>
                            </div>
                             {/* Person 3 */}
                             <div className="relative flex flex-col items-center">
                                <div className="h-12 w-12 rounded-full bg-primary/20"></div>
                                <div className="h-24 w-20 rounded-t-full bg-primary/20"></div>
                            </div>
                       </div>
                    </div>
                </div>
            </section>

             {/* How to Join Section */}
            <section>
                 <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold">Ready to Join?</h2>
                    <p className="text-muted-foreground">Becoming a member is simple. Here's how it works.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 text-center">
                    {steps.map((step, index) => (
                        <div key={step.title} className="flex flex-col items-center">
                            <div className="flex items-center justify-center size-16 rounded-full bg-primary/10 mb-4">
                               {step.icon}
                            </div>
                            <h3 className="text-xl font-semibold">{index + 1}. {step.title}</h3>
                            <p className="text-muted-foreground">{step.description}</p>
                        </div>
                    ))}
                </div>
                <div className="text-center mt-10">
                    <Button asChild size="lg">
                        <Link href="/become-member">Start Your Application <ArrowRight className="ml-2"/></Link>
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
  
  // If the user is not a member, show the landing page.
  if (user.role === 'user') {
      return <UserLandingPage />;
  }


  const totalLoanAmount = activeLoans.reduce((sum, loan) => sum + loan.loanAmount, 0);
  const totalPrincipalLeft = activeLoans.reduce((sum, loan) => sum + loan.principal, 0);
  const loanProgress = totalLoanAmount > 0 ? ((totalLoanAmount - totalPrincipalLeft) / totalLoanAmount) * 100 : 0;

  const loanStatusVariant: { [key: string]: "default" | "secondary" | "outline" | "destructive" } = {
      active: 'default',
      paid: 'secondary',
      pending: 'outline',
      rejected: 'destructive'
  }

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
                <CardTitle>Active Loans Overview</CardTitle>
                <CardDescription>
                  {activeLoans.length > 0 ? `You have ${activeLoans.length} active loan(s).`: 'You have no active loans.'}
                </CardDescription>
              </div>
            </div>
             <Button asChild>
                <Link href="/apply-loan">Apply for New Loan <ArrowRight className="ml-2" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-6">
            {activeLoans.length > 0 ? (
              <div>
                <div className='grid grid-cols-2 md:grid-cols-3 gap-4 text-center pb-6'>
                    <div>
                        <p className="text-sm text-muted-foreground">Total Loan Amount</p>
                        <p className="text-2xl font-bold">₹{totalLoanAmount.toLocaleString()}</p>
                    </div>
                     <div>
                        <p className="text-sm text-muted-foreground">Total Principal Left</p>
                        <p className="text-2xl font-bold">₹{totalPrincipalLeft.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Active Loans</p>
                        <p className="text-2xl font-bold">{activeLoans.length}</p>
                    </div>
                </div>
                <Progress value={loanProgress} aria-label={`${loanProgress.toFixed(0)}% of total loans paid`} />
                <p className="text-right text-sm text-muted-foreground pt-2">{loanProgress.toFixed(2)}% Paid</p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>No active loan data to display. Apply for a new loan to get started.</p>
              </div>
            )}
          </CardContent>
           <CardFooter>
                <Button variant="link" asChild>
                    <Link href="/my-finances">Manage Loans & View Details &rarr;</Link>
                </Button>
            </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your Funds</CardTitle>
            <CardDescription>Current balance of your funds.</CardDescription>
          </CardHeader>
           <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full"><PiggyBank className="size-5 text-primary" /></div>
                <p className="font-medium">Share Fund</p>
              </div>
              <p className="font-bold text-lg">₹{user.shareFund.toLocaleString()}</p>
            </div>
             <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-accent/10 rounded-full"><ShieldCheck className="size-5 text-accent" /></div>
                <p className="font-medium">Guaranteed Fund</p>
              </div>
              <p className="font-bold text-lg">₹{user.guaranteedFund.toLocaleString()}</p>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-purple-500/10 rounded-full"><Wallet className="size-5 text-purple-500" /></div>
                <p className="font-medium">Thrift Fund</p>
              </div>
              <p className="font-bold text-lg">₹{(user.thriftFund ?? 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
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
        <Card className="lg:col-span-2">
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
                    <div key={benefit.title} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <p className="font-medium">{benefit.title}</p>
                        <Badge variant="outline">{benefit.description}</Badge>
                    </div>
                ))}
            </CardContent>
        </Card>
      </div>

       <Card>
          <CardHeader>
            <CardTitle>Recent Loan History</CardTitle>
            <CardDescription>
              Your last 5 loan applications.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {loanHistory.length > 0 ? (
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
                             <TableRow key={loan._id.toString()}>
                                <TableCell>{new Date(loan.createdAt).toLocaleDateString()}</TableCell>
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

    </div>
  );
}
