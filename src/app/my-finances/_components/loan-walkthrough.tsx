
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ILoan } from "@/models/loan";
import { Download, Loader2, Eye } from "lucide-react";
import { calculateMonthlyInterest } from "@/lib/coop-calculations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ScheduleRow {
    month: number;
    year: number;
    openingBalance: number;
    interestPayment: number;
    principalPayment: number;
    totalPayment: number;
    closingBalance: number;
    notes: string;
}

export function LoanWalkthrough({ loan }: { loan: ILoan }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [schedule, setSchedule] = useState<ScheduleRow[]>([]);

    const generateSchedule = (): ScheduleRow[] => {
        const scheduleData: ScheduleRow[] = [];
        let currentPrincipal = loan.principal;
        let currentDate = new Date(loan.issueDate || new Date());
        
        currentDate.setDate(1);
        currentDate.setMonth(currentDate.getMonth() + 1);
            
        const approvedPaymentChanges = [...loan.modificationRequests]
            .filter(r => r.type === 'change_payment' && r.status === 'approved' && r.effectiveYear !== undefined && r.effectiveMonth !== undefined)
            .sort((a,b) => (a.effectiveYear!*12 + a.effectiveMonth!) - (b.effectiveYear!*12 + b.effectiveMonth!));
        
        const approvedAmountIncreases = [...loan.modificationRequests]
            .filter(r => r.type === 'increase_amount' && r.status === 'approved' && r.approvalDate)
            .sort((a, b) => new Date(a.approvalDate!).getTime() - new Date(b.approvalDate!).getTime());

        let monthCounter = 1;

        while (currentPrincipal > 0) {
            let notes = "";
            let month = currentDate.getMonth();
            let year = currentDate.getFullYear();
            
            const increaseThisMonth = approvedAmountIncreases.find(inc => {
                const approvalDate = new Date(inc.approvalDate!);
                return approvalDate.getFullYear() === year && approvalDate.getMonth() === month;
            });
            if(increaseThisMonth) {
                notes += `Loan increased by ₹${increaseThisMonth.requestedValue.toLocaleString()}. `;
            }
            
            let principalPayment = loan.monthlyPrincipalPayment;
            const paymentChange = approvedPaymentChanges.find(c => c.effectiveYear === year && c.effectiveMonth === month);
            if (paymentChange) {
                principalPayment = paymentChange.requestedValue;
                notes += `Monthly payment for this month changed to ₹${principalPayment.toLocaleString()}. `;
            }

            const interestPayment = calculateMonthlyInterest(currentPrincipal, loan.interestRate);
            const actualPrincipalPayment = Math.min(currentPrincipal, principalPayment);
            const totalPayment = interestPayment + actualPrincipalPayment;
            const closingBalance = currentPrincipal - actualPrincipalPayment;

            scheduleData.push({
                month: month + 1,
                year: year,
                openingBalance: currentPrincipal,
                interestPayment,
                principalPayment: actualPrincipalPayment,
                totalPayment,
                closingBalance,
                notes: notes.trim()
            });
            
            currentPrincipal = closingBalance;
            currentDate.setMonth(currentDate.getMonth() + 1);
            
            monthCounter++;
            if (monthCounter > 1200) { 
                 console.error("Loan schedule generation exceeded 100 years, breaking.");
                 scheduleData.push({
                     month: 0, year: 0, openingBalance: 0, interestPayment: 0, principalPayment: 0, totalPayment: 0, closingBalance: 0, notes: "ERROR: Schedule too long."
                 })
                 break;
            }
        }
        return scheduleData;
    }

    const handleOpen = () => {
        if (schedule.length === 0) {
            setSchedule(generateSchedule());
        }
    }
    
    const downloadCSV = () => {
        setIsGenerating(true);
        try {
            const dataToDownload = schedule.length > 0 ? schedule : generateSchedule();
            
            const headers = [
                "Month",
                "Year",
                "Opening Balance",
                "Principal Payment",
                "Interest Payment",
                "Total Monthly Payment",
                "Closing Balance",
                "Notes"
            ];
            
            const csvRows = dataToDownload.map(row => 
                [
                    row.month,
                    row.year,
                    row.openingBalance.toFixed(2),
                    row.principalPayment.toFixed(2),
                    row.interestPayment.toFixed(2),
                    row.totalPayment.toFixed(2),
                    row.closingBalance.toFixed(2),
                    `"${row.notes.replace(/"/g, '""')}"`
                ].join(',')
            );
            
            const csvContent = "data:text/csv;charset=utf-8," 
                + headers.join(',') + "\n"
                + csvRows.join('\n');
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `loan_walkthrough_${loan._id}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } finally {
            setIsGenerating(false);
        }
    }

    return (
        <Dialog onOpenChange={(isOpen) => { if (isOpen) handleOpen(); }}>
            <DialogTrigger asChild>
                 <Button size="sm" variant="outline">
                    <Eye className="mr-2" /> View
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Loan Repayment Schedule</DialogTitle>
                    <DialogDescription>
                        A complete month-by-month breakdown of your loan repayment.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-96">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background">
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Opening</TableHead>
                                <TableHead className="text-right">Principal</TableHead>
                                <TableHead className="text-right">Interest</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Closing</TableHead>
                                <TableHead>Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {schedule.map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell>{row.month}/{row.year}</TableCell>
                                    <TableCell className="text-right">₹{row.openingBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                                    <TableCell className="text-right">₹{row.principalPayment.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                                    <TableCell className="text-right">₹{row.interestPayment.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                                    <TableCell className="text-right">₹{row.totalPayment.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                                    <TableCell className="text-right">₹{row.closingBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                                    <TableCell className="text-xs">{row.notes}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
                <DialogFooter>
                    <Button onClick={downloadCSV} disabled={isGenerating}>
                        {isGenerating ? (
                            <Loader2 className="mr-2 animate-spin" />
                        ) : (
                            <Download className="mr-2" />
                        )}
                        Download CSV
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
