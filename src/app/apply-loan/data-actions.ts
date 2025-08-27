
"use server";

import { getSession } from "@/lib/session";
import dbConnect from "@/lib/mongodb";
import User, { UserRole } from "@/models/user";
import { getBankSettings } from "../admin/settings/actions";
import { IBank } from "@/models/bank";
import Loan from "@/models/loan";

interface UserData {
    shareFund: number;
    guaranteedFund: number;
    role: UserRole;
    bankSettings: IBank;
    activeLoanPrincipal: number;
}

export async function getUserFundsAndSettings(): Promise<UserData> {
    const session = await getSession();
    if (!session) {
        throw new Error("User not authenticated.");
    }

    try {
        await dbConnect();
        const [user, bankSettings, activeLoans] = await Promise.all([
             User.findById(session.id).select('shareFund guaranteedFund role').lean(),
             getBankSettings(),
             Loan.find({ user: session.id, status: 'active' }).select('principal').lean()
        ]);
        
        if (!user) {
             throw new Error("User not found.");
        }
        if (!bankSettings) {
             throw new Error("Bank settings not found.");
        }

        const totalActivePrincipal = activeLoans.reduce((sum, loan) => sum + loan.principal, 0);
        
        return {
            shareFund: user.shareFund || 0,
            guaranteedFund: user.guaranteedFund || 0,
            role: user.role || 'user',
            bankSettings: bankSettings,
            activeLoanPrincipal: totalActivePrincipal
        };
    } catch (error) {
        console.error("Failed to get user funds and settings:", error);
        throw new Error("Could not load required data.");
    }
}
