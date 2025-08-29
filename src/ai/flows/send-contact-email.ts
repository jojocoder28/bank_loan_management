'use server';

/**
 * @fileOverview A Genkit flow for sending a contact form email.
 *
 * - sendContactEmail - A function that handles sending the email.
 * - SendContactEmailInput - The input type for the sendContactEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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

// Define the Genkit prompt for sending the email
const emailPrompt = ai.definePrompt({
  name: 'sendContactEmailPrompt',
  input: { schema: SendContactEmailInputSchema },
  // Simple prompt that formats the email content.
  // In a real scenario, you might add more instructions for formatting or tone.
  prompt: `
From: {{fromName}} <{{fromEmail}}>
To: sarikhor94@gmail.com
Subject: New Contact Form Submission from Website

You have received a new message from the website contact form:

Name: {{fromName}}
Email: {{fromEmail}}

Message:
{{message}}
  `,
  // There is no explicit output schema as we are using this for side-effects (sending email).
});

// Define the Genkit flow
const sendContactEmailFlow = ai.defineFlow(
  {
    name: 'sendContactEmailFlow',
    inputSchema: SendContactEmailInputSchema,
    outputSchema: z.void(), // The flow does not return a value
  },
  async (input) => {
    // This is a simplified implementation. A real email sending integration
    // (like Nodemailer with an SMTP service or a third-party API like SendGrid)
    // would be called here. For this context, we will log the email content
    // as if it were being sent. The prompt is evaluated to generate the content.
    const { output } = await emailPrompt(input);
    console.log("Email that would be sent:");
    console.log(output);

    // In a real integration, you would have something like:
    // await emailService.send({
    //   to: 'sarikhor94@gmail.com',
    //   subject: `New Contact Form Submission from ${input.fromName}`,
    //   body: output,
    // });
  }
);
