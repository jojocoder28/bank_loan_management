
'use server';

import { getSession, createSession } from "@/lib/session";
import dbConnect from "@/lib/mongodb";
import User, { IUser } from "@/models/user";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';

config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function getProfileForEditing(): Promise<IUser | null> {
    const session = await getSession();
    if (!session) {
        return null;
    }
    await dbConnect();
    const user = await User.findById(session.id).lean();
    if (!user) {
        return null;
    }
    return JSON.parse(JSON.stringify(user));
}

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  personalAddress: z.string().min(1, 'Personal address is required.'),
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


export async function updateUserProfile(prevState: any, formData: FormData) {
    const session = await getSession();
    if (!session) {
        return { error: 'You must be logged in to update your profile.' }
    }
    
    // Filter out empty values from formData before parsing
    const filteredFormData = new FormData();
    for (const [key, value] of formData.entries()) {
        if (value !== '' && value !== null && value !== undefined) {
             // For file inputs, check size
            if (value instanceof File && value.size === 0) {
                continue;
            }
            filteredFormData.append(key, value);
        }
    }

    const values = Object.fromEntries(filteredFormData.entries());
    const validatedFields = profileSchema.partial().safeParse(values); // Use .partial() to allow missing fields
    
    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors };
    }

    await dbConnect();
    const user = await User.findById(session.id);

    if (!user) {
         return { error: { form: 'Could not find your user profile.'} }
    }

    const { photo, ...profileData } = validatedFields.data;
    let photoUrl = user.photoUrl;

    if (photo && photo.size > 0) {
      if (photo.size > 2 * 1024 * 1024) { // 2MB limit
          return { error: { photo: ["File size cannot exceed 2MB."] } };
      }
      try {
        const fileBuffer = Buffer.from(await photo.arrayBuffer());
        const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: "coop_loan_members", resource_type: "image" },
                (error, result) => error ? reject(error) : resolve(result)
            );
            uploadStream.end(fileBuffer);
        });
        photoUrl = (uploadResult as any).secure_url;
      } catch (error) {
         console.error("Cloudinary Upload Error:", error);
         return { error: { form: 'Failed to upload image. Please try again.' } };
      }
    }

    // Build an update object with only the validated fields
    const updateData: Partial<IUser> = { ...profileData };

    if (photoUrl) {
        updateData.photoUrl = photoUrl;
    }
    
    if (profileData.email) {
        updateData.email = profileData.email.toLowerCase();
    }


    Object.assign(user, updateData);
    
    await user.save();
    
    // Create a new session with the updated data
    const updatedSessionUser = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl,
        membershipApplied: user.membershipApplied,
        phone: user.phone,
    };
    await createSession(updatedSessionUser);

    revalidatePath('/settings');
    revalidatePath('/profile');
    revalidatePath('/become-member');

    return { success: "Profile updated successfully.", error: null }
}
