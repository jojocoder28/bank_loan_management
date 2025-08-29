
'use client';

import { Suspense, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { verifyUserOtp } from './actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { resendVerificationOtp } from '../login/reverify-actions';
import { useToast } from '@/hooks/use-toast';

function VerificationContent() {
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone');
  const router = useRouter();

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [otp, setOtp] = useState('');
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !otp) {
        setMessage("Phone number or OTP is missing.");
        setStatus('error');
        return;
    }
    setStatus('loading');
    setMessage('');

    const result = await verifyUserOtp(phone, otp);
    if (result.success) {
        setStatus('success');
        setMessage(result.message);
        setTimeout(() => router.push('/login'), 3000); // Redirect after 3 seconds
    } else {
        setStatus('error');
        setMessage(result.message);
    }
  }

  const handleResend = async () => {
    if (!phone) return;
    setIsResending(true);
    const result = await resendVerificationOtp(phone);
    if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
      toast({ title: 'Success', description: 'A new OTP has been sent to the console.' });
    }
    setIsResending(false);
  }

  if (status === 'success') {
      return (
         <Card className="mx-auto max-w-sm w-full text-center">
             <CardHeader>
                <CheckCircle className="mx-auto size-12 text-green-500" />
                <CardTitle className="text-2xl mt-4">Verification Successful!</CardTitle>
             </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">{message}</p>
            </CardContent>
             <CardFooter>
                 <Button asChild className="w-full">
                    <Link href="/login">Go to Login</Link>
                </Button>
            </CardFooter>
         </Card>
      )
  }

  return (
    <Card className="mx-auto max-w-sm w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Verify Phone Number</CardTitle>
        <CardDescription>
          We've sent a 6-digit OTP to your phone (check the console). Enter it below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'error' && (
            <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Verification Failed</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
            </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
                 <Label htmlFor="otp">Enter OTP</Label>
                 <Input
                    id="otp"
                    name="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    required
                    className="text-center text-lg tracking-widest"
                    placeholder="_ _ _ _ _ _"
                 />
            </div>
            <Button type="submit" className="w-full" disabled={status === 'loading'}>
                {status === 'loading' ? <Loader2 className="animate-spin" /> : 'Verify Account'}
            </Button>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Didn't receive the code?
          <Button variant="link" onClick={handleResend} disabled={isResending}>
            {isResending ? 'Sending...' : 'Resend OTP'}
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}


export default function VerifyPhonePage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <Suspense fallback={<Card className="p-8"><Loader2 className="animate-spin" /></Card>}>
                <VerificationContent />
            </Suspense>
        </div>
    )
}
