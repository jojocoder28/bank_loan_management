
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
import * as XLSX from "xlsx";


export function StatementTable({ data, month, year }: { data: StatementRow[], month: string, year: number }) {
    const [isDownloading, setIsDownloading] = useState(false);

    const totals = data.reduce((acc, row) => {
        acc.thrift += row.thriftFundContribution;
        acc.share += row.shareFundContribution;
        acc.principal += row.loanPrincipalPayment;
        acc.interest += row.loanInterestPayment;
        acc.total += row.totalDeduction;
        return acc;
    }, { thrift: 0, share: 0, principal: 0, interest: 0, total: 0 });

    const downloadExcel = () => {
        setIsDownloading(true);
        try {
            const wb = XLSX.utils.book_new();

            // --- 1. Summary Sheet ---
            const summaryData = [
                [`Summary for the month of ${month}, ${year}`],
                [],
                ["Thrift Fund(TF)", totals.thrift],
                ["Share Fund(SF)", totals.share],
                ["Own Loan Principal", totals.principal],
                ["Own Loan Interest", totals.interest],
                ["Total Deduction", totals.total],
            ];
            const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
            summaryWs['!cols'] = [{ wch: 20 }, { wch: 15 }];
            XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");


            // --- 2. Deduction List Sheets ---
            const recordsPerPage = 42;
            const numPages = Math.ceil(data.length / recordsPerPage);
            
            const mainHeader = [
                `SARISHA & KHORDA G P PRIMARY SCHOOL TEACHERS CO OPERATIVE CREDIT SOCIETY LTD`,
                `Regd No 11/1994/South 24 Parganas, Date 30/09/1994 Mob No. 9233092709`,
                `Deduction List for the month of ${month}, ${year}`
            ];
            
            const tableHeaders = [
                `Sl. No`, `Name`, `S.B. A/C No`, `Bank Loan Prin`, `Bank Loan Int.`, `OWN LOAN Prin.`, `OWN LOAN Int.`, `S F`, `T.F`, `Total`
            ];

            for (let i = 0; i < numPages; i++) {
                const start = i * recordsPerPage;
                const end = start + recordsPerPage;
                const pageData = data.slice(start, end);
                let pageTotal = { principal: 0, interest: 0, share: 0, thrift: 0, total: 0 };
                
                const pageRows = [];
                // Add headers
                pageRows.push([mainHeader[0]]);
                pageRows.push([mainHeader[1]]);
                pageRows.push([mainHeader[2]]);
                pageRows.push([]); // Empty row
                pageRows.push(tableHeaders);

                // Add data rows
                pageData.forEach(row => {
                    pageRows.push([
                        row.slNo,
                        row.name,
                        `'${row.bankAccountNumber}`, // Prepend with ' to ensure it's treated as text
                        '', // Bank Loan Prin
                        '', // Bank Loan Int
                        row.loanPrincipalPayment,
                        row.loanInterestPayment,
                        row.shareFundContribution,
                        row.thriftFundContribution,
                        row.totalDeduction,
                    ]);
                    
                    pageTotal.principal += row.loanPrincipalPayment;
                    pageTotal.interest += row.loanInterestPayment;
                    pageTotal.share += row.shareFundContribution;
                    pageTotal.thrift += row.thriftFundContribution;
                    pageTotal.total += row.totalDeduction;
                });

                // Add page total row
                pageRows.push([]); // Empty row
                pageRows.push([
                    '', '', `Page ${i + 1} Total`, '', '',
                    pageTotal.principal,
                    pageTotal.interest,
                    pageTotal.share,
                    pageTotal.thrift,
                    pageTotal.total
                ]);
                
                const pageWs = XLSX.utils.aoa_to_sheet(pageRows);
                // Set column widths
                pageWs['!cols'] = [
                    { wch: 8 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, 
                    { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 15 }
                ];
                XLSX.utils.book_append_sheet(wb, pageWs, `Page ${i + 1}`);
            }

            XLSX.writeFile(wb, `monthly_statement_${month}_${year}.xlsx`);

        } finally {
             setIsDownloading(false);
        }
    }

  return (
    <div>
        <div className="flex justify-end mb-4">
             <Button onClick={downloadExcel} disabled={isDownloading}>
                {isDownloading ? (
                    <Loader2 className="mr-2 animate-spin" />
                ) : (
                    <Download className="mr-2" />
                )}
                Download Excel
            </Button>
        </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sl. No</TableHead>
            <TableHead>Membership #</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Bank Acc #</TableHead>
            <TableHead className="text-right">Loan Principal</TableHead>
            <TableHead className="text-right">Loan Interest</TableHead>
            <TableHead className="text-right">Share Fund (SF)</TableHead>
            <TableHead className="text-right">Thrift Fund (TF)</TableHead>
            <TableHead className="text-right font-bold">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.userId}>
               <TableCell>{row.slNo}</TableCell>
               <TableCell>{row.membershipNumber}</TableCell>
              <TableCell className="font-medium">
                <Link href={`/admin/users/${row.userId}`} className="text-primary hover:underline">
                    {row.name}
                </Link>
              </TableCell>
              <TableCell>{row.bankAccountNumber}</TableCell>
              <TableCell className="text-right">₹{row.loanPrincipalPayment.toLocaleString()}</TableCell>
              <TableCell className="text-right">₹{row.loanInterestPayment.toLocaleString()}</TableCell>
              <TableCell className="text-right">₹{row.shareFundContribution.toLocaleString()}</TableCell>
              <TableCell className="text-right">₹{row.thriftFundContribution.toLocaleString()}</TableCell>
              <TableCell className="text-right font-bold">₹{row.totalDeduction.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
            <TableRow className="font-bold text-base bg-secondary">
                <TableCell colSpan={4}>Totals</TableCell>
                <TableCell className="text-right">₹{totals.principal.toLocaleString()}</TableCell>
                <TableCell className="text-right">₹{totals.interest.toLocaleString()}</TableCell>
                <TableCell className="text-right">₹{totals.share.toLocaleString()}</TableCell>
                <TableCell className="text-right">₹{totals.thrift.toLocaleString()}</TableCell>
                <TableCell className="text-right">₹{totals.total.toLocaleString()}</TableCell>
            </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
