
'use server';

/**
 * @fileOverview A Genkit flow for sending a contact form email using Resend.
 *
 * - sendContactEmail - A function that handles sending the email.
 * - SendContactEmailInput - The input type for the sendContactEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Resend } from 'resend';

// Initialize Resend with the API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

// Define the schema for the email sending flow input
const SendContactEmailInputSchema = z.object({
  fromName: z.string().describe('The name of the person sending the message.'),
  fromEmail: z.string().email().describe('The email address of the sender.'),
  message: z.string().describe('The content of the message.'),
});
export type SendContactEmailInput = z.infer<typeof SendContactEmailInputSchema>;

// This is the main function that will be called from the server action.
export async function sendContactEmail(input: SendContactEmailInput): Promise<void> {
  await sendContactEmailFlow(input);
}

// Define the Genkit prompt for creating the text body of the email
const emailPrompt = ai.definePrompt({
  name: 'sendContactEmailPrompt',
  input: { schema: SendContactEmailInputSchema },
  // This prompt formats the text content for the email body.
  prompt: `
You have received a new message from the website contact form:

Name: {{fromName}}
Email: {{fromEmail}}

Message:
{{message}}
  `,
});

// Define the Genkit flow
const sendContactEmailFlow = ai.defineFlow(
  {
    name: 'sendContactEmailFlow',
    inputSchema: SendContactEmailInputSchema,
    outputSchema: z.void(), // The flow does not return a value
  },
  async (input) => {
    const { output: emailBody } = await emailPrompt(input);

    if (!process.env.RESEND_API_KEY) {
        console.error("Resend API key is not configured. Email will be logged to console instead of sent.");
        console.log("Email that would be sent:");
        console.log(emailBody);
        // We throw an error to let the user know something is wrong with the configuration.
        throw new Error("Email service is not configured on the server.");
    }
    
    // Send the email using the Resend SDK
    await resend.emails.send({
      // IMPORTANT: Resend requires the 'from' address to be a domain you have verified.
      // For development, 'onboarding@resend.dev' is a safe default.
      from: 'S&KGPPS Co-op <onboarding@resend.dev>',
      to: ['sarikhor94@gmail.com'],
      subject: `New Contact from ${input.fromName}`,
      text: emailBody!, // The plain text version of the email
      reply_to: input.fromEmail, // So replies go directly to the user
    });
  }
);
