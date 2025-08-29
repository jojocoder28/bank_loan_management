
'use server';

import { z } from 'zod';
import { sendContactEmail } from '@/ai/flows/send-contact-email';

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

  const { firstName, lastName, email, message } = validatedFields.data;
  const fullName = `${firstName} ${lastName}`;

  try {
    // Call the Genkit flow to handle the email sending logic
    await sendContactEmail({
      fromName: fullName,
      fromEmail: email,
      message: message,
    });
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Contact Form Error:', error);
    return { error: 'An unexpected error occurred. Please try again later.' };
  }
}
