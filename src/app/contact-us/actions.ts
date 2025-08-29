
'use server';

import { z } from 'zod';
import { Resend } from 'resend';

const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email('Invalid email address.'),
  message: z.string().min(1, 'Message is required.'),
});

type ContactFormState = {
  error?: string | null;
  success?: boolean;
};

export async function submitContactForm(
  prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  // 1. Validate form data
  const validatedFields = contactSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    message: formData.get('message'),
  });

  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError || 'Invalid input.' };
  }

  // 2. Check for Resend API Key
  if (!process.env.RESEND_API_KEY) {
      console.error("Resend API key is not configured. Email cannot be sent.");
      return { error: "The email service is not configured on the server. Please contact an administrator." };
  }

  const { firstName, lastName, email, message } = validatedFields.data;
  const fullName = `${firstName} ${lastName}`;
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    // 3. Send the email using Resend
    await resend.emails.send({
      // IMPORTANT: Resend requires the 'from' address to be a domain you have verified.
      // For development, 'onboarding@resend.dev' is a safe default.
      from: 'S&KGPPS Co-op Contact Form <onboarding@resend.dev>',
      to: 'sarikhor94@gmail.com',
      subject: `New Contact Form Submission from ${fullName}`,
      reply_to: email,
      // Create a simple text body for the email
      text: `You have received a new message from your website contact form.\n\n` +
            `Name: ${fullName}\n` +
            `Email: ${email}\n\n` +
            `Message:\n${message}`,
    });
    
    return { success: true, error: null };

  } catch (error) {
    console.error('Resend API Error:', error);
    return { error: 'An unexpected error occurred while sending the email. Please try again later.' };
  }
}
