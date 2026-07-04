"use server";

import dbConnect from "@/lib/mongodb";
import User from "@/models/user";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";

const addMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  membershipNumber: z.string().min(1, "Membership number is required."),
  phone: z.string().min(10, "Phone number must be at least 10 digits."),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  shareFund: z.coerce.number().min(0, "Share fund balance must be non-negative."),
  thriftFund: z.coerce.number().min(0, "Thrift fund balance must be non-negative."),
  guaranteedFund: z.coerce.number().min(0, "Guaranteed fund balance must be non-negative."),
  bankAccountNumber: z.string().optional(),
  workplace: z.string().optional(),
  profession: z.string().optional(),
  workplaceAddress: z.string().optional(),
  personalAddress: z.string().optional(),
  age: z.preprocess((val) => (val === '' ? undefined : val), z.coerce.number().int().min(1, "Age must be positive.").optional()),
  gender: z.enum(['male', 'female', 'other', '']).optional(),
  nomineeName: z.string().optional(),
  nomineeRelation: z.string().optional(),
  nomineeAge: z.preprocess((val) => (val === '' ? undefined : val), z.coerce.number().int().min(1, "Nominee age must be positive.").optional()),
});

export async function addMember(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
      return { error: { form: ["Unauthorized access."] } };
  }

  const values = Object.fromEntries(formData.entries());
  
  // 1. Validate form fields
  const validatedFields = addMemberSchema.safeParse(values);
  if (!validatedFields.success) {
      return { error: validatedFields.error.flatten().fieldErrors };
  }

  const data = validatedFields.data;

  try {
      await dbConnect();

      // 2. Check for duplicate phone
      const existingUserByPhone = await User.findOne({ phone: data.phone });
      if (existingUserByPhone) {
          return { error: { phone: ["An account with this phone number already exists."] } };
      }

      // 3. Check for duplicate membershipNumber
      const existingUserByNum = await User.findOne({ membershipNumber: data.membershipNumber });
      if (existingUserByNum) {
          return { error: { membershipNumber: ["This membership number is already assigned."] } };
      }

      // 4. Check for duplicate email if provided
      if (data.email) {
          const existingUserByEmail = await User.findOne({ email: data.email.toLowerCase() });
          if (existingUserByEmail) {
              return { error: { email: ["An account with this email already exists."] } };
          }
      }

      // 5. Generate default password: password + membershipNumber
      const defaultPassword = 'password' + String(data.membershipNumber).trim();

      // 6. Build the user object for creation
      const userData: any = {
          name: data.name,
          email: data.email ? data.email.toLowerCase() : undefined,
          phone: data.phone,
          password: defaultPassword, // pre-save hook in User model will hash this
          role: 'member',
          status: 'active',
          isVerified: true,
          membershipApplied: true,
          requiresPasswordChange: true,
          membershipNumber: data.membershipNumber,
          shareFund: data.shareFund,
          thriftFund: data.thriftFund,
          guaranteedFund: data.guaranteedFund,
          bankAccountNumber: data.bankAccountNumber,
          workplace: data.workplace,
          profession: data.profession,
          workplaceAddress: data.workplaceAddress,
          personalAddress: data.personalAddress,
          age: data.age,
          gender: data.gender || undefined,
          nomineeName: data.nomineeName,
          nomineeRelation: data.nomineeRelation,
          nomineeAge: data.nomineeAge,
      };

      await User.create(userData);

      revalidatePath("/admin/users");
      return { 
          success: true, 
          credentials: { 
              name: data.name, 
              membershipNumber: data.membershipNumber, 
              phone: data.phone, 
              password: defaultPassword 
          } 
      };

  } catch (error: any) {
      console.error("Add Member Error:", error);
      if (error.code === 11000) {
           if (error.keyPattern?.phone) {
              return { error: { phone: ["An account with this phone number already exists."] } };
          }
           if (error.keyPattern?.membershipNumber) {
              return { error: { membershipNumber: ["This membership number is already assigned."] } };
          }
           if (error.keyPattern?.email && data.email) {
              return { error: { email: ["An account with this email already exists."] } };
          }
      }
      return { error: { form: ["An unexpected database error occurred. Please try again."] } };
  }
}
