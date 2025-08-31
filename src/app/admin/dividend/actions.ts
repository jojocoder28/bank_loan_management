
"use server";

import dbConnect from "@/lib/mongodb";
import User from "@/models/user";
import { getBankSettings } from "../settings/actions";
import { calculateDividend } from "@/lib/coop-calculations";

export interface DividendReportRow {
    memberId: string;
    name: string;
    membershipNumber: string;
    shareFund: number;
    dividendRate: number;
    dividendAmount: number;
    finalShareFund: number;
}

export async function getDividendReportData(): Promise<DividendReportRow[]> {
    await dbConnect();

    const [members, bankSettings] = await Promise.all([
        User.find({ role: 'member', status: 'active' }).sort({ name: 1 }).lean(),
        getBankSettings(),
    ]);

    const dividendRate = bankSettings.shareFundDividendRate;

    const reportData: DividendReportRow[] = members.map(member => {
        const shareFund = member.shareFund || 0;
        const dividendAmount = calculateDividend(shareFund, dividendRate);
        const finalShareFund = shareFund + dividendAmount;

        return {
            memberId: member._id.toString(),
            name: member.name,
            membershipNumber: member.membershipNumber || 'N/A',
            shareFund,
            dividendRate,
            dividendAmount,
            finalShareFund,
        };
    });

    return reportData;
}
