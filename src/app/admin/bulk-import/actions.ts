
"use server";

import { z } from "zod";
import * as XLSX from "xlsx";
import dbConnect from "@/lib/mongodb";
import User, { IUser } from "@/models/user";
import Loan from "@/models/loan";
import { revalidatePath } from "next/cache";

const fileSchema = z.instanceof(File, { message: "File is required." })
  .refine(file => file.size > 0, "File cannot be empty.")
  .refine(file => file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "File must be a .xlsx spreadsheet.");

const importSchema = z.object({
  membersFile: fileSchema,
  fundsFile: fileSchema,
  loansFile: fileSchema,
});


export async function bulkImportData(prevState: any, formData: FormData) {
  const validatedFields = importSchema.safeParse({
    membersFile: formData.get("membersFile"),
    fundsFile: formData.get("fundsFile"),
    loansFile: formData.get("loansFile"),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors.membersFile?.[0] || 'Invalid files provided.' };
  }
  
  const { membersFile, fundsFile, loansFile } = validatedFields.data;

  try {
    await dbConnect();

    // 1. Parse all files first
    const [membersData, fundsData, loansData] = await Promise.all([
      parseFile(membersFile),
      parseFile(fundsFile),
      parseFile(loansFile),
    ]);

    // 2. Import Members
    const { createdCount: membersCreated, updatedCount: membersUpdated } = await importMembers(membersData);

    // 3. Update Fund Balances
    const { updatedCount: fundsUpdated, notFound: fundsNotFound } = await updateFundBalances(fundsData);
    if(fundsNotFound > 0) {
        throw new Error(`${fundsNotFound} membership numbers in the Funds file did not match any imported members.`);
    }
    
    // 4. Import Loans
    const { createdCount: loansCreated, notFound: loansNotFound } = await importLoans(loansData);
     if(loansNotFound > 0) {
        throw new Error(`${loansNotFound} membership numbers in the Loans file did not match any imported members.`);
    }

    revalidatePath('/admin/users');
    revalidatePath('/admin/ledger');

    const summary = `
    Import complete.
    --------------------
    Members: ${membersCreated} created, ${membersUpdated} updated.
    Funds: ${fundsUpdated} members' fund balances updated.
    Loans: ${loansCreated} loans created.
    `;
    
    return { success: true, summary };

  } catch (error: any) {
    console.error("Bulk Import Error:", error);
    return { error: error.message || "An unexpected error occurred during import." };
  }
}

async function parseFile(file: File): Promise<any[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet, { defval: "" });
}

// --- Member Import Logic ---
async function importMembers(data: any[]) {
    let createdCount = 0;
    let updatedCount = 0;

    for (const row of data) {
        if (!row.MembershipNumber || !row.FullName || !row.PhoneNumber) {
            console.warn("Skipping member row due to missing required fields:", row);
            continue;
        }

        const userData: Partial<IUser> & { requiresPasswordChange?: boolean } = {
            name: row.FullName,
            phone: String(row.PhoneNumber),
            email: row.Email?.toLowerCase() || null,
            password: `password${String(row.MembershipNumber)}`, // Dynamic temporary password
            role: 'member',
            status: row.Status?.toLowerCase() || 'active',
            membershipApplied: true,
            isVerified: true,
            requiresPasswordChange: true, // Force password change on first login
            createdAt: row.JoinDate ? new Date(row.JoinDate) : new Date(),
            photoUrl: row.PhotoURL,
            workplace: row.Workplace,
            profession: row.Profession,
            workplaceAddress: row.WorkplaceAddress,
            personalAddress: row.PersonalAddress,
            membershipNumber: String(row.MembershipNumber),
            bankAccountNumber: String(row.BankAccountNumber),
            age: row.Age,
            gender: row.Gender?.toLowerCase(),
            nomineeName: row.NomineeName,
            nomineeRelation: row.NomineeRelation,
            nomineeAge: row.NomineeAge,
        };
        
        try {
            const result = await User.updateOne(
                { membershipNumber: userData.membershipNumber },
                { $setOnInsert: userData },
                { upsert: true }
            );

            if (result.upsertedCount > 0) {
                createdCount++;
            } else if (result.modifiedCount > 0) {
                updatedCount++;
            }
        } catch (e: any) {
             if (e.code === 11000) { // Duplicate key error
                throw new Error(`Duplicate key error for member. Check for duplicate Membership Numbers, Phone Numbers, or Emails. Offending row: ${JSON.stringify(row)}`);
             }
             throw e;
        }
    }
    return { createdCount, updatedCount };
}


// --- Fund Balance Update Logic ---
async function updateFundBalances(data: any[]) {
    let updatedCount = 0;
    let notFound = 0;
    for (const row of data) {
        if (!row.MembershipNumber) continue;

        const result = await User.updateOne(
            { membershipNumber: String(row.MembershipNumber) },
            { $set: {
                shareFund: Number(row.ShareFund) || 0,
                guaranteedFund: Number(row.GuaranteedFund) || 0,
                thriftFund: Number(row.ThriftFund) || 0,
            }}
        );
        if (result.matchedCount > 0) {
            updatedCount++;
        } else {
            notFound++;
        }
    }
    return { updatedCount, notFound };
}


// --- Loan Import Logic ---
async function importLoans(data: any[]) {
    let createdCount = 0;
    let notFound = 0;
    for (const row of data) {
        if (!row.MembershipNumber || !row.OriginalLoanAmount || !row.LoanIssueDate) {
            console.warn("Skipping loan row due to missing required fields:", row);
            continue;
        }

        const user = await User.findOne({ membershipNumber: String(row.MembershipNumber) }).select('_id');
        if (!user) {
            notFound++;
            continue;
        }

        const loanData = {
            user: user._id,
            loanAmount: Number(row.OriginalLoanAmount),
            principal: Number(row.CurrentOutstandingPrincipal) || Number(row.OriginalLoanAmount),
            interestRate: Number(row.InterestRate) || 10,
            issueDate: new Date(row.LoanIssueDate),
            status: row.Status?.toLowerCase() || 'active',
            monthlyPrincipalPayment: Number(row.MonthlyPayment) || 0,
            loanTenureMonths: Number(row.TenureMonths) || 0,
        };

        // We assume we are only importing historical loans, so we don't duplicate them.
        // A more robust check might look at amount and date.
        const existingLoan = await Loan.findOne({ user: user._id, loanAmount: loanData.loanAmount, issueDate: loanData.issueDate });
        if (!existingLoan) {
             await Loan.create(loanData);
             createdCount++;
        }
    }
    return { createdCount, notFound };
}
