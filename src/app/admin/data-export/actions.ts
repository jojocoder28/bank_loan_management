
"use server";

import dbConnect from "@/lib/mongodb";
import BulkImportData, { IBulkImportData } from "@/models/bulkImportData";
import * as XLSX from "xlsx";

export async function getSubmittedData(): Promise<IBulkImportData[]> {
  await dbConnect();
  // Fetch un-exported data first, then exported, to show new entries at the top
  const data = await BulkImportData.find({}).sort({ isExported: 1, createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(data));
}

export async function downloadMembersXlsx(data: IBulkImportData[]) {
  "use server";
  
  try {
    const dataToExport = data.map(item => ({
      'MembershipNumber': item.membershipNumber || '',
      'FullName': item.fullName,
      'PhoneNumber': item.phoneNumber,
      'Email': item.email || '',
      'JoinDate': item.joinDate,
      'Status': 'active', // Default status for new imports
      'PhotoURL': '', // This would be manually filled if needed
      'Workplace': item.workplace,
      'Profession': item.profession,
      'WorkplaceAddress': item.workplaceAddress,
      'PersonalAddress': item.personalAddress,
      'BankAccountNumber': item.bankAccountNumber,
      'Age': item.age,
      'Gender': item.gender,
      'NomineeName': item.nomineeName,
      'NomineeRelation': item.nomineeRelation,
      'NomineeAge': item.nomineeAge,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Members");
    
    // Set column widths
    worksheet['!cols'] = [
        { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
        { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 30 },
        { wch: 30 }, { wch: 20 }, { wch: 8 }, { wch: 10 }, { wch: 25 },
        { wch: 15 }, { wch: 15 }
    ];

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    
    // Mark the downloaded records as exported
    const idsToUpdate = data.map(item => item._id);
    await BulkImportData.updateMany(
        { _id: { $in: idsToUpdate } },
        { $set: { isExported: true } }
    );
    
    return { success: true, file: buffer.toString('base64') };

  } catch (error) {
    console.error("Download Error:", error);
    return { success: false, error: "Failed to generate Excel file." };
  }
}
