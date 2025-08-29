
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { StatementRow } from "../actions";
import { useState } from "react";
import Link from "next/link";

export function StatementTable({ data }: { data: StatementRow[] }) {
    const [isDownloading, setIsDownloading] = useState(false);

    const totals = data.reduce((acc, row) => {
        acc.thrift += row.thriftFundContribution;
        acc.principal += row.loanPrincipalPayment;
        acc.interest += row.loanInterestPayment;
        acc.total += row.totalDeduction;
        return acc;
    }, { thrift: 0, principal: 0, interest: 0, total: 0 });

    const downloadCSV = () => {
        setIsDownloading(true);
        try {
            const headers = [
                "Member Name",
                "Membership No",
                "Thrift Fund (₹)",
                "Loan Principal (₹)",
                "Loan Interest (₹)",
                "Total Deduction (₹)",
                "Loan ID",
                "Outstanding Principal (₹)"
            ];

            const csvRows = data.map(row => 
                [
                    `"${row.name.replace(/"/g, '""')}"`,
                    row.membershipNumber,
                    row.thriftFundContribution,
                    row.loanPrincipalPayment,
                    row.loanInterestPayment,
                    row.totalDeduction,
                    row.loanDetails?.id || "N/A",
                    row.loanDetails?.outstandingPrincipal || 0
                ].join(',')
            );
            
            const csvContent = "data:text/csv;charset=utf-8," 
                + headers.join(',') + "\n"
                + csvRows.join('\n');
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `monthly_statement_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } finally {
             setIsDownloading(false);
        }
    }

  return (
    <div>
        <div className="flex justify-end mb-4">
             <Button onClick={downloadCSV} disabled={isDownloading}>
                {isDownloading ? (
                    <Loader2 className="mr-2 animate-spin" />
                ) : (
                    <Download className="mr-2" />
                )}
                Download CSV
            </Button>
        </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member Name</TableHead>
            <TableHead>Membership #</TableHead>
            <TableHead className="text-right">Thrift Fund</TableHead>
            <TableHead className="text-right">Loan Principal</TableHead>
            <TableHead className="text-right">Loan Interest</TableHead>
            <TableHead className="text-right font-bold">Total Deduction</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.userId}>
              <TableCell className="font-medium">
                <Link href={`/admin/users/${row.userId}`} className="text-primary hover:underline">
                    {row.name}
                </Link>
              </TableCell>
              <TableCell>{row.membershipNumber}</TableCell>
              <TableCell className="text-right">₹{row.thriftFundContribution.toLocaleString()}</TableCell>
              <TableCell className="text-right">₹{row.loanPrincipalPayment.toLocaleString()}</TableCell>
              <TableCell className="text-right">₹{row.loanInterestPayment.toLocaleString()}</TableCell>
              <TableCell className="text-right font-bold">₹{row.totalDeduction.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
            <TableRow className="font-bold text-base bg-secondary">
                <TableCell colSpan={2}>Totals</TableCell>
                <TableCell className="text-right">₹{totals.thrift.toLocaleString()}</TableCell>
                <TableCell className="text-right">₹{totals.principal.toLocaleString()}</TableCell>
                <TableCell className="text-right">₹{totals.interest.toLocaleString()}</TableCell>
                <TableCell className="text-right">₹{totals.total.toLocaleString()}</TableCell>
            </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
