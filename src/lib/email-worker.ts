import nodemailer from "nodemailer";
import dbConnect from "@/lib/mongodb";
import User from "@/models/user";
import EmailJob from "@/models/emailJob";
import { logAuditActivity } from "@/lib/audit";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
  || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:9002');

/**
 * Creates a Nodemailer transporter configured for Google SMTP.
 * If pool is true, it keeps a single connection open and queues messages,
 * avoiding connection flooding/rate-limits from Gmail.
 */
export function createGmailTransporter(pooled = false) {
    const smtpEmail = process.env.SMTP_EMAIL;
    const smtpPassword = process.env.SMTP_PASSWORD;
    
    if (!smtpEmail || !smtpPassword) {
        throw new Error("Google SMTP credentials (SMTP_EMAIL or SMTP_PASSWORD) are not configured in environment variables.");
    }

    return nodemailer.createTransport({
        service: 'gmail',
        pool: pooled,
        maxConnections: 1, // Only 1 socket connection open at a time
        maxMessages: Infinity,
        auth: {
            user: smtpEmail,
            pass: smtpPassword,
        },
    } as any);
}

/**
 * Sends a single email using Google SMTP
 */
export async function sendGoogleEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
    const smtpEmail = process.env.SMTP_EMAIL;
    const transporter = createGmailTransporter(false);
    
    try {
        await transporter.sendMail({
            from: `"S&KGPPS Co-op" <${smtpEmail}>`,
            to,
            subject,
            html,
        });
    } finally {
        transporter.close();
    }
}

/**
 * Async background worker job to send bulk onboarding emails.
 * Uses a single pooled SMTP connection and introduces a 4-second delay
 * between emails to prevent Gmail rate-limiting/banning.
 */
export async function executeBulkOnboardingEmailJob(jobId: string, actorEmail: string = 'Admin'): Promise<void> {
    await dbConnect();
    
    const job = await EmailJob.findById(jobId);
    if (!job) {
        console.error(`[EmailWorker] Job ${jobId} not found.`);
        return;
    }

    const smtpEmail = process.env.SMTP_EMAIL;
    if (!smtpEmail || !process.env.SMTP_PASSWORD) {
        job.status = 'failed';
        job.error = "Google SMTP credentials are not configured.";
        job.completedAt = new Date();
        await job.save();
        return;
    }

    // Find all active members with email who require password setup
    const users = await User.find({
        role: 'member',
        status: 'active',
        email: { $ne: null },
        requiresPasswordChange: true
    });

    if (users.length === 0) {
        job.status = 'completed';
        job.totalCount = 0;
        job.logs.push('No pending member accounts found that require password onboarding emails.');
        job.completedAt = new Date();
        await job.save();
        return;
    }

    // Initialize job state
    job.status = 'in_progress';
    job.totalCount = users.length;
    job.startedAt = new Date();
    job.logs.push(`Started bulk email job for ${users.length} members with pooled SMTP connection (4s delay between sends).`);
    await job.save();

    // Create pooled transporter (1 single open connection for all emails)
    const transporter = createGmailTransporter(true);

    try {
        // Verify connection before sending
        await transporter.verify();
        console.log(`[EmailWorker] Pooled SMTP connection established for Job ${jobId}. Processing ${users.length} emails.`);

        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            if (!user.email) continue;

            const defaultPassword = `password${user.membershipNumber}`;
            job.currentRecipient = `${user.name} (${user.email})`;

            try {
                await transporter.sendMail({
                    from: `"S&KGPPS Co-op" <${smtpEmail}>`,
                    to: user.email,
                    subject: 'Welcome to S&KGPPS Co-op: Your Account Credentials',
                    html: `
                        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                            <h2 style="color: #007bff; text-align: center;">Welcome to S&KGPPS Co-op</h2>
                            <p>Dear <strong>${user.name}</strong>,</p>
                            <p>An administrator has set up your member account for the Sarisha & Khorda G P Primary School Teachers Co Operative Credit Society LTD.</p>
                            <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; border-radius: 4px; margin: 20px 0;">
                                <p style="margin: 5px 0;"><strong>Membership #:</strong> ${user.membershipNumber || 'N/A'}</p>
                                <p style="margin: 5px 0;"><strong>Username (Email):</strong> ${user.email}</p>
                                <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #e9ecef; padding: 2px 6px; border-radius: 4px; font-size: 1.1em;">${defaultPassword}</code></p>
                            </div>
                            <p>Please click the button below to log in. You will be prompted to change this temporary password upon your first login:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${baseUrl}/login" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Log In to Account</a>
                            </div>
                            <p style="font-size: 0.9em; color: #666;">If you have any questions, please contact an administrator.</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                            <p style="font-size: 0.8em; color: #999; text-align: center;">This is an automated system email. Please do not reply directly to this message.</p>
                        </div>
                    `
                });

                job.sentCount += 1;
                job.logs.push(`[${i + 1}/${users.length}] Successfully sent email to ${user.name} (${user.email}).`);
                console.log(`[EmailWorker] [${i + 1}/${users.length}] Sent to ${user.email}`);
            } catch (err: any) {
                console.error(`[EmailWorker] Failed to send email to ${user.email}:`, err);
                job.failedCount += 1;
                job.logs.push(`[${i + 1}/${users.length}] Failed to send email to ${user.name} (${user.email}): ${err.message}`);
            }

            await job.save();

            // Delay 4 seconds between emails if there are more emails remaining
            if (i < users.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 4000));
            }
        }

        job.status = 'completed';
        job.currentRecipient = undefined;
        job.completedAt = new Date();
        job.logs.push(`Job completed. Total Sent: ${job.sentCount}, Failed: ${job.failedCount}. Connection closed.`);
        await job.save();

        await logAuditActivity(
            'ONBOARDING_BULK_EMAILS_SENT',
            actorEmail,
            undefined,
            `Sent bulk welcome onboarding credentials via background job to ${job.sentCount} members (Failed: ${job.failedCount}).`,
            { jobId, sentCount: job.sentCount, failedCount: job.failedCount }
        );

    } catch (e: any) {
        console.error(`[EmailWorker] Critical error in bulk email job ${jobId}:`, e);
        job.status = 'failed';
        job.error = e.message || 'An unexpected error occurred during execution.';
        job.completedAt = new Date();
        await job.save();
    } finally {
        transporter.close();
        console.log(`[EmailWorker] Transporter connection closed for Job ${jobId}.`);
    }
}
