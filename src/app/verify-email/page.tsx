
'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { verifyUserToken } from './actions';

function VerificationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing. Please check your email link.');
      return;
    }

    async function verify() {
      const result = await verifyUserToken(token!);
      if (result.success) {
        setStatus('success');
        setMessage(result.message);
        setTimeout(() => router.push('/login'), 3000); // Redirect after 3 seconds
      } else {
        setStatus('error');
        setMessage(result.message);
      }
    }

    verify();
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="mx-auto max-w-sm w-full text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Email Verification</CardTitle>
          <CardDescription>
            {status === 'loading' && <Loader2 className="mx-auto size-12 animate-spin text-primary" />}
            {status === 'success' && <CheckCircle className="mx-auto size-12 text-green-500" />}
            {status === 'error' && <AlertTriangle className="mx-auto size-12 text-destructive" />}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{message}</p>
        </CardContent>
        <CardFooter>
          {status !== 'loading' && (
            <Button asChild className="w-full">
              <Link href="/login">Go to Login</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}


export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerificationContent />
        </Suspense>
    )
}
