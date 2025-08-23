
'use server';

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import type { User, DecodedToken } from './types';

const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
  throw new Error('JWT_SECRET environment variable is not set');
}
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function getSession(): Promise<User | null> {
  const sessionCookie = (await cookies()).get('session')?.value;
  if (!sessionCookie) return null;
  
  const session = await decrypt(sessionCookie);
  if (!session) return null;

  // Refresh the session if it's about to expire (e.g., in the last 15 minutes)
  const now = Date.now();
  const expires = session.exp * 1000;
  if (expires - now < 15 * 60 * 1000) {
    const newExpires = new Date(now + 60 * 60 * 1000); // 1 hour from now
    const newSessionToken = await encrypt({ user: session.user, exp: newExpires.getTime() / 1000 });
    cookies().set('session', newSessionToken, { expires: newExpires, httpOnly: true });
  }

  return session.user;
}

export async function updateSession(request: NextRequest) {
    const session = request.cookies.get('session')?.value;
    if (!session) return;

    const parsed = await decrypt(session);
    parsed.expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    const res = await encrypt(parsed);
    
    const cookieStore = cookies();
    cookieStore.set('session', res, {
        httpOnly: true,
        expires: parsed.expires,
    });
}

export async function createSession(user: User) {
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    // We only want to store the essential, non-sensitive parts in the session
    const sessionUser: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl,
        membershipApplied: user.membershipApplied
    }

    const session = await encrypt({ user: sessionUser, exp: expires.getTime() / 1000 });

    cookies().set('session', session, { expires, httpOnly: true });
}

export async function deleteSession() {
    cookies().set('session', '', { expires: new Date(0) });
}
