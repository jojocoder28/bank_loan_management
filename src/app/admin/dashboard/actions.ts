"use server";

import dbConnect from "@/lib/mongodb";
import User from "@/models/user";
import Loan from "@/models/loan";

export interface AdminStats {
    totalUsers: number;
    totalMembers: number;
    totalBoardMembers: number;
    pendingLoans: number;
    activeLoans: number;
    totalLoans: number;
    
    totalBorrowedCapital: number;
    totalInterestEarned: number;
    totalSystemFunds: number;
    loansByStatus: { name: string; value: number; fill: string }[];
    recentLoansTrend: { month: string; applications: number }[];
}

export async function getAdminStats(): Promise<AdminStats> {
    await dbConnect();

    const [
        totalUsers,
        totalMembers,
        totalBoardMembers,
        pendingLoans,
        activeLoans,
        totalLoans
    ] = await Promise.all([
        User.countDocuments({ role: 'user' }),
        User.countDocuments({ role: 'member' }),
        User.countDocuments({ role: 'board_member' }),
        Loan.countDocuments({ status: 'pending' }),
        Loan.countDocuments({ status: 'active' }),
        Loan.countDocuments({})
    ]);

    // Financial Aggregations
    // 1. Total System Funds
    const userFundsAgg = await User.aggregate([
        {
            $group: {
                _id: null,
                totalShare: { $sum: "$shareFund" },
                totalGuaranteed: { $sum: "$guaranteedFund" },
                totalThrift: { $sum: "$thriftFund" }
            }
        }
    ]);
    const funds = userFundsAgg[0] || { totalShare: 0, totalGuaranteed: 0, totalThrift: 0 };
    const totalSystemFunds = funds.totalShare + funds.totalGuaranteed + funds.totalThrift;

    // 2. Total Borrowed Capital & Interest
    const loanAgg = await Loan.aggregate([
        {
            $facet: {
                capital: [
                    { $match: { status: { $in: ['active', 'paid'] } } },
                    { $group: { _id: null, totalBorrowed: { $sum: "$loanAmount" } } }
                ],
                interest: [
                    { $unwind: "$payments" },
                    { $match: { "payments.type": "interest" } },
                    { $group: { _id: null, totalInterest: { $sum: "$payments.amount" } } }
                ]
            }
        }
    ]);

    const totalBorrowedCapital = loanAgg[0]?.capital[0]?.totalBorrowed || 0;
    const totalInterestEarned = loanAgg[0]?.interest[0]?.totalInterest || 0;

    // 3. Loans by Status (Pie Chart)
    const paidLoans = await Loan.countDocuments({ status: 'paid' });
    const rejectedLoans = await Loan.countDocuments({ status: 'rejected' });
    
    const loansByStatus = [
        { name: "Active", value: activeLoans, fill: "hsl(var(--chart-1))" },
        { name: "Pending", value: pendingLoans, fill: "hsl(var(--chart-2))" },
        { name: "Paid", value: paidLoans, fill: "hsl(var(--chart-3))" },
        { name: "Rejected", value: rejectedLoans, fill: "hsl(var(--chart-4))" }
    ].filter(s => s.value > 0);

    // 4. Recent Loans Trend (Bar Chart - Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const trendAgg = await Loan.aggregate([
        { 
            $match: { 
                issueDate: { $exists: true, $ne: null, $gte: sixMonthsAgo } 
            } 
        },
        {
            $group: {
                _id: {
                    year: { $year: "$issueDate" },
                    month: { $month: "$issueDate" }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Fill in the last 6 months even if empty
    const recentLoansTrend = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();
        const found = trendAgg.find(t => t._id.month === m && t._id.year === y);
        recentLoansTrend.push({
            month: monthNames[m - 1],
            applications: found ? found.count : 0
        });
    }

    return {
        totalUsers,
        totalMembers,
        totalBoardMembers,
        pendingLoans,
        activeLoans,
        totalLoans,
        totalBorrowedCapital,
        totalInterestEarned,
        totalSystemFunds,
        loansByStatus,
        recentLoansTrend
    };
}
