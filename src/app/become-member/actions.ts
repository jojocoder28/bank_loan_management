
'use server';

import { getSession } from "@/lib/session";
import dbConnect from "@/lib/mongodb";
import User from "@/models/user";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';
import { getBankSettings } from "../admin/settings/actions";

config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const applicationSchema = z.object({
  personalAddress: z.string().min(1, 'Personal address is required.'),
  phone: z.string().min(1, 'Phone number is required.'),
  age: z.coerce.number().min(18, 'You must be at least 18 years old.'),
  gender: z.enum(['male', 'female', 'other']),
  workplace: z.string().min(1, 'Workplace is required.'),
  profession: z.string().min(1, 'Profession is required.'),
  workplaceAddress: z.string().min(1, 'Workplace address is required.'),
  bankAccountNumber: z.string().min(1, 'Bank account number is required.'),
  nomineeName: z.string().min(1, 'Nominee name is required.'),
  nomineeRelation: z.string().min(1, 'Nominee relation is required.'),
  nomineeAge: z.coerce.number().min(1, 'Nominee age is required.'),
  photo: z.any().optional(),
});


export async function applyForMembership(prevState: any, formData: FormData) {
    const session = await getSession();
    if (!session) {
        return { error: 'You must be logged in to apply.' }
    }
    
    const values = Object.fromEntries(formData.entries());
    const validatedFields = applicationSchema.safeParse(values);
    
    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors };
    }

    await dbConnect();
    const [user, bankSettings] = await Promise.all([
        User.findById(session.id),
        getBankSettings()
    ]);

    if (!user) {
         return { error: 'Could not find your user profile.' }
    }
    
    if (!bankSettings) {
      return { error: 'Bank settings are not configured. Please contact an administrator.' };
    }

    if (user.role !== 'user') {
        return { error: `You cannot apply. Your current role is already '${user.role}'.` }
    }
    
    if (user.membershipApplied) {
        return { error: `Your application is already pending approval.` }
    }

    // Handle photo upload
    const { photo, ...applicationData } = validatedFields.data;
    let photoUrl = user.photoUrl; // Keep existing photo if no new one is uploaded

    if (photo && photo.size > 0) {
      try {
        const fileBuffer = Buffer.from(await photo.arrayBuffer());

        const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: "coop_loan_members", // Optional: organize uploads in a folder
                    resource_type: "image",
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );
            uploadStream.end(fileBuffer);
        });

        photoUrl = (uploadResult as any).secure_url;

      } catch (error) {
         console.error("Cloudinary Upload Error:", error);
         return { error: 'Failed to upload image. Please try again.' };
      }
    }

    // Update user with all the new details
    Object.assign(user, applicationData);
    user.photoUrl = photoUrl;

    // This is a simplified process. In a real-world scenario, this would
    // likely redirect to a payment gateway to handle the initial deposit.
    // For now, we'll assume the user has made the payment offline and we
    // just update their status to pending.
    user.membershipApplied = true;
    // For the demo, we'll auto-credit the initial amount from the bank settings.
    user.shareFund = (user.shareFund || 0) + bankSettings.initialShareFundDeposit;
    
    await user.save();

    revalidatePath('/become-member');
    revalidatePath('/admin/approvals');

    return { success: true, error: null }
}
