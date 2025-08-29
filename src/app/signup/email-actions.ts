
'use server';

import { Resend } from 'resend';

const fromEmail = 'S&KGPPS Co-op <onboarding@resend.dev>';
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.error("Resend API key is not configured. Email cannot be sent.");
    // In production, you might want to throw an error or handle this differently
    throw new Error('The email service is not configured. Please contact an administrator.');
  }

  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  const resend = new Resend(resendApiKey);

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'dasjojo7@gmail.com',
      subject: 'Verify your email address for S&KGPPS Co-op',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Hello ${name},</h2>
          <p>Thank you for registering with Sarisha & Khorda G P Primary School Teachers Co Operative Credit Society LTD.</p>
          <p>Please click the button below to verify your email address and activate your account:</p>
          <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
          <p>If you did not create an account, you can safely ignore this email.</p>
          <br/>
          <p>Thank you,</p>
          <p>The S&KGPPS Co-op Team</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Resend API Error (Verification Email):', error);
    // Handle the error appropriately, maybe re-throw or log to a monitoring service
    throw new Error('Could not send verification email.');
  }
}
