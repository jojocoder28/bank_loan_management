"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Cog, Calendar, Gift, Download, Edit2, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { numberToWords } from "@/lib/number-to-words";
import { StatementRow, PendingMonth, DeductionOverrideInput, processMonthlyDeductions, processAllAnnualDues, undoLastMonthlyProcess } from "../actions";
import { StatementPDFGenerator } from "./statement-pdf-generator";
import { InterestBreakdownPopover } from "./interest-breakdown-popover";
import { RotateCcw } from "lucide-react";

interface StatementDashboardProps {
  initialData: StatementRow[];
  pendingMonths: PendingMonth[];
  selectedMonth: number;
  selectedYear: number;
  monthName: string;
  canUndo: boolean;
  lastProcessedLabel: string | null;
}

export function StatementDashboard({
  initialData,
  pendingMonths,
  selectedMonth,
  selectedYear,
  monthName,
  canUndo,
  lastProcessedLabel,
}: StatementDashboardProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isMonthlyPending, startMonthlyTransition] = useTransition();
  const [isAnnualPending, startAnnualTransition] = useTransition();
  const [isUndoPending, startUndoTransition] = useTransition();

  const handleUndoLastProcess = () => {
    startUndoTransition(async () => {
      try {
        const result = await undoLastMonthlyProcess();
        if (result.error) {
          toast({
            variant: "destructive",
            title: "Rollback Failed",
            description: result.error
          });
        } else if (result.success) {
          toast({
            title: "Deductions Undone",
            description: result.success
          });
          router.refresh();
        }
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Rollback Error",
          description: err.message || "An unexpected error occurred."
        });
      }
    });
  };

  // Local overrides state
  const [overrides, setOverrides] = useState<Record<string, DeductionOverrideInput>>({});

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<StatementRow | null>(null);
  const [overrideMode, setOverrideMode] = useState<"default" | "pause" | "stop_loan_principal" | "custom">("default");
  
  // Custom mode field values
  const [customThrift, setCustomThrift] = useState<string>("");
  const [customPrincipal, setCustomPrincipal] = useState<string>("");
  const [customInterest, setCustomInterest] = useState<string>("");
  const [customTotal, setCustomTotal] = useState<string>("");

  const handleCustomTotalChange = (val: string) => {
    setCustomTotal(val);
    if (val === "" || !editingRow) return;

    const total = Number(val);
    if (isNaN(total) || total < 0) return;

    if (editingRow.loanDetails) {
      const defaultInterest = editingRow.loanInterestPayment;
      const defaultPrincipal = editingRow.loanPrincipalPayment;

      const interest = Math.min(total, defaultInterest);
      const principal = Math.min(total - interest, defaultPrincipal);
      const thrift = Math.max(0, total - interest - principal);

      setCustomInterest(interest.toString());
      setCustomPrincipal(principal.toString());
      setCustomThrift(thrift.toString());
    } else {
      setCustomThrift(total.toString());
    }
  };

  useEffect(() => {
    if (overrideMode === "custom" && editingRow) {
      const t = Number(customThrift) || 0;
      const p = Number(customPrincipal) || 0;
      const i = Number(customInterest) || 0;
      setCustomTotal((t + p + i).toString());
    }
  }, [customThrift, customPrincipal, customInterest, overrideMode, editingRow]);

  // Determine if this is the oldest pending month
  const isOldestPending = pendingMonths.length === 0 || (
    pendingMonths[0].month === selectedMonth && 
    pendingMonths[0].year === selectedYear
  );

  // Selected month value for dropdown
  const dropdownValue = `${selectedMonth}-${selectedYear}`;

  // Handle month selection change
  const handleMonthChange = (val: string) => {
    const [m, y] = val.split("-");
    router.push(`/admin/statement?month=${m}&year=${y}`);
  };

  // Load overrides from localStorage when month/year changes
  useEffect(() => {
    const key = `coop-deduction-overrides-${selectedMonth}-${selectedYear}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setOverrides(JSON.parse(saved));
      } catch (e) {
        setOverrides({});
      }
    } else {
      setOverrides({});
    }
  }, [selectedMonth, selectedYear]);

  // Persist overrides to localStorage whenever they change
  useEffect(() => {
    const key = `coop-deduction-overrides-${selectedMonth}-${selectedYear}`;
    if (Object.keys(overrides).length > 0) {
      localStorage.setItem(key, JSON.stringify(overrides));
    } else {
      localStorage.removeItem(key);
    }
  }, [overrides, selectedMonth, selectedYear]);

  // Compute final table data based on overrides
  const tableData = initialData.map((row) => {
    const override = overrides[row.userId];
    if (!override) return row;

    let thrift = row.thriftFundContribution;
    let principal = row.loanPrincipalPayment;
    let interest = row.loanInterestPayment;

    if (override.pauseDeduction) {
      thrift = 0;
      principal = 0;
      interest = 0;
    } else {
      if (override.customThrift !== undefined) {
        thrift = override.customThrift;
      }

      if (override.stopPrincipal) {
        principal = 0;
      } else if (override.customPrincipal !== undefined) {
        principal = override.customPrincipal;
      }

      if (override.customInterest !== undefined) {
        interest = override.customInterest;
      }
    }

    return {
      ...row,
      thriftFundContribution: thrift,
      loanPrincipalPayment: principal,
      loanInterestPayment: interest,
      totalDeduction: thrift + principal + interest,
    };
  });

  // Calculate totals
  const totals = tableData.reduce(
    (acc, row) => {
      acc.thrift += row.thriftFundContribution;
      acc.share += row.shareFundContribution;
      acc.principal += row.loanPrincipalPayment;
      acc.interest += row.loanInterestPayment;
      acc.total += row.totalDeduction;
      return acc;
    },
    { thrift: 0, share: 0, principal: 0, interest: 0, total: 0 }
  );

  // Map to actions summary format
  const summary = {
    totalThrift: totals.thrift,
    totalShare: totals.share,
    totalLoanPrincipal: totals.principal,
    totalLoanInterest: totals.interest,
    grandTotal: totals.total,
  };

  // Open override dialog for user
  const openOverrideDialog = (row: StatementRow) => {
    setEditingRow(row);
    const existing = overrides[row.userId];
    if (existing) {
      if (existing.pauseDeduction) {
        setOverrideMode("pause");
        setCustomTotal("0");
      } else if (existing.stopPrincipal) {
        setOverrideMode("stop_loan_principal");
        setCustomTotal((row.thriftFundContribution + row.loanInterestPayment).toString());
      } else {
        setOverrideMode("custom");
        const t = existing.customThrift ?? row.thriftFundContribution;
        const p = existing.customPrincipal ?? row.loanPrincipalPayment;
        const i = existing.customInterest ?? row.loanInterestPayment;
        setCustomThrift(t.toString());
        setCustomPrincipal(p.toString());
        setCustomInterest(i.toString());
        setCustomTotal((t + p + i).toString());
      }
    } else {
      setOverrideMode("default");
      setCustomThrift(row.thriftFundContribution.toString());
      setCustomPrincipal(row.loanPrincipalPayment.toString());
      setCustomInterest(row.loanInterestPayment.toString());
      setCustomTotal(row.totalDeduction.toString());
    }
    setDialogOpen(true);
  };

  // Save changes from override dialog
  const saveOverrides = () => {
    if (!editingRow) return;

    if (overrideMode === "default") {
      const newOverrides = { ...overrides };
      delete newOverrides[editingRow.userId];
      setOverrides(newOverrides);
    } else if (overrideMode === "pause") {
      setOverrides({
        ...overrides,
        [editingRow.userId]: {
          userId: editingRow.userId,
          pauseDeduction: true,
          stopPrincipal: false,
        },
      });
    } else if (overrideMode === "stop_loan_principal") {
      setOverrides({
        ...overrides,
        [editingRow.userId]: {
          userId: editingRow.userId,
          pauseDeduction: false,
          stopPrincipal: true,
        },
      });
    } else {
      // Custom mode
      const thriftVal = customThrift !== "" ? Number(customThrift) : undefined;
      const principalVal = customPrincipal !== "" ? Number(customPrincipal) : undefined;
      const interestVal = customInterest !== "" ? Number(customInterest) : undefined;

      setOverrides({
        ...overrides,
        [editingRow.userId]: {
          userId: editingRow.userId,
          pauseDeduction: false,
          stopPrincipal: false,
          customThrift: thriftVal,
          customPrincipal: principalVal,
          customInterest: interestVal,
        },
      });
    }

    setDialogOpen(false);
    setEditingRow(null);
    toast({
      title: "Overrides Applied",
      description: `Updated deduction options for ${editingRow.name}.`,
    });
  };

  // Process monthly deductions server call
  const handleProcessMonthly = () => {
    startMonthlyTransition(async () => {
      const result = await processMonthlyDeductions(selectedMonth, selectedYear, overrides);
      if (result.error) {
        toast({ variant: "destructive", title: "Processing Failed", description: result.error });
      } else {
        toast({ title: "Success", description: result.success });
        localStorage.removeItem(`coop-deduction-overrides-${selectedMonth}-${selectedYear}`);
        setOverrides({});
        router.refresh();
      }
    });
  };

  // Process annual dues server call
  const handleProcessAnnual = () => {
    startAnnualTransition(async () => {
      const result = await processAllAnnualDues();
      if (result.error) {
        toast({ variant: "destructive", title: "Processing Failed", description: result.error });
      } else {
        toast({ title: "Success", description: result.success });
        router.refresh();
      }
    });
  };

  // Excel export using current visible overrides data
  const downloadExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const totalInWords = numberToWords(totals.total);

      // 1. Summary Sheet
      const summaryData = [
        [`Summary for the month of ${monthName}, ${selectedYear}`],
        [],
        ["Thrift Fund(TF)", totals.thrift],
        ["Share Fund(SF)", totals.share],
        ["Own Loan Principal", totals.principal],
        ["Own Loan Interest", totals.interest],
        ["Total Deduction", totals.total],
        [],
        [`Please deposit the amount Rs. ${totals.total.toLocaleString()} (Rupees ${totalInWords} only) to the SBCS Number 129342134828 of the society and oblige.`],
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      summaryWs["!cols"] = [{ wch: 25 }, { wch: 15 }];
      if (!summaryWs["!merges"]) summaryWs["!merges"] = [];
      summaryWs["!merges"].push({ s: { r: 8, c: 0 }, e: { r: 8, c: 1 } });
      XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

      // 2. Deduction List Sheets
      const recordsPerPage = 42;
      const numPages = Math.ceil(tableData.length / recordsPerPage);

      const mainHeader = [
        `SARISHA & KHORDA G P PRIMARY SCHOOL TEACHERS CO OPERATIVE CREDIT SOCIETY LTD`,
        `Regd No 11/1994/South 24 Parganas, Date 30/09/1994 Mob No. 9233092709`,
        `Deduction List for the month of ${monthName}, ${selectedYear}`,
      ];

      const tableHeaders = [
        `Sl. No`, `Name`, `S.B. A/C No`, `Bank Loan Prin`, `Bank Loan Int.`, `OWN LOAN Prin.`, `OWN LOAN Int.`, `S F`, `T.F`, `Total`
      ];

      for (let i = 0; i < numPages; i++) {
        const start = i * recordsPerPage;
        const end = start + recordsPerPage;
        const pageData = tableData.slice(start, end);
        let pageTotal = { principal: 0, interest: 0, share: 0, thrift: 0, total: 0 };

        const pageRows = [];
        pageRows.push([mainHeader[0]]);
        pageRows.push([mainHeader[1]]);
        pageRows.push([mainHeader[2]]);
        pageRows.push([]);
        pageRows.push(tableHeaders);

        pageData.forEach((row) => {
          const rowData = [
            row.slNo,
            row.name,
            { v: row.bankAccountNumber, t: "s" },
            "",
            "",
            row.loanPrincipalPayment,
            row.loanInterestPayment,
            row.shareFundContribution,
            row.thriftFundContribution,
            row.totalDeduction,
          ];
          pageRows.push(rowData);

          pageTotal.principal += row.loanPrincipalPayment;
          pageTotal.interest += row.loanInterestPayment;
          pageTotal.share += row.shareFundContribution;
          pageTotal.thrift += row.thriftFundContribution;
          pageTotal.total += row.totalDeduction;
        });

        pageRows.push([]);
        pageRows.push([
          "", "", `Page ${i + 1} Total`, "", "",
          pageTotal.principal,
          pageTotal.interest,
          pageTotal.share,
          pageTotal.thrift,
          pageTotal.total,
        ]);

        const pageWs = XLSX.utils.aoa_to_sheet(pageRows);
        pageWs["!cols"] = [
          { wch: 8 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
          { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 15 }
        ];
        XLSX.utils.book_append_sheet(wb, pageWs, `Page ${i + 1}`);
      }

      XLSX.writeFile(wb, `monthly_statement_${monthName}_${selectedYear}.xlsx`);
      toast({ title: "Excel Saved", description: "The Excel statement has been successfully downloaded." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Excel Error", description: e.message || "Failed to generate Excel." });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Pending Months & Options Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/40 p-4 border rounded-xl">
        <div className="flex items-center gap-3">
          <Calendar className="size-5 text-primary" />
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground font-semibold">Processing Month</label>
            <Select value={dropdownValue} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-[220px] font-semibold">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {pendingMonths.map((m) => (
                  <SelectItem key={`${m.month}-${m.year}`} value={`${m.month}-${m.year}`}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                {isMonthlyPending ? <Loader2 className="mr-2 animate-spin" /> : <Cog className="mr-2" />}
                Process Deductions
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will process monthly thrift and loan payments for all active members for the month of <strong>{monthName}, {selectedYear}</strong>.
                  {Object.keys(overrides).length > 0 && (
                    <span className="block mt-2 font-semibold text-destructive">
                      Note: {Object.keys(overrides).length} custom user overrides are currently active and will be applied.
                    </span>
                  )}
                  This action cannot be undone. Ensure all settings and overrides are correct before proceeding.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleProcessMonthly} disabled={isMonthlyPending}>
                  Yes, Process Deductions
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button variant="outline" asChild>
            <Link href="/admin/statement/annual-dues">
              <Gift className="mr-2 size-4" />
              Annual Dues
            </Link>
          </Button>

          {canUndo && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  {isUndoPending ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
                  Undo Last Process ({lastProcessedLabel})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Undo Last Monthly Process</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to revert and undo the processed deductions for <strong>{lastProcessedLabel}</strong>?
                    This will subtract the monthly thrift fund contributions and restore the loan principals back to their previous values.
                    <br /><br />
                    <span className="font-semibold text-destructive">Warning: This action will permanently delete payment records created for this month and cannot be undone.</span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleUndoLastProcess} disabled={isUndoPending} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    Yes, Undo Deductions
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Button variant="outline" onClick={downloadExcel}>
            <Download className="mr-2 size-4" /> Export Excel
          </Button>

          <StatementPDFGenerator data={tableData} summary={summary} month={monthName} year={selectedYear} />
          
          <Button asChild variant="secondary">
            <Link href="/admin/statement/summary">
              Summary Details <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Warning Alert if out of order */}
      {!isOldestPending && pendingMonths.length > 1 && (
        <Alert className="border-yellow-600/50 bg-yellow-500/10 text-yellow-800 dark:text-yellow-400">
          <AlertTriangle className="size-5 text-yellow-600 dark:text-yellow-400" />
          <AlertTitle className="font-semibold">Sequential Processing Recommendation</AlertTitle>
          <AlertDescription>
            You are viewing <strong>{monthName}, {selectedYear}</strong>, but <strong>{pendingMonths[0].label}</strong> is the oldest pending month.
            It is recommended to process <strong>{pendingMonths[0].label}</strong> first to ensure correct loan outstanding principal calculations.
          </AlertDescription>
        </Alert>
      )}

      {/* Table Card */}
      <Card className="w-full overflow-hidden">
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Sl. No</TableHead>
                  <TableHead>Membership #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Bank Acc #</TableHead>
                  <TableHead className="text-right">Loan Principal</TableHead>
                  <TableHead className="text-right">Loan Interest</TableHead>
                  <TableHead className="text-right">Share Fund (SF)</TableHead>
                  <TableHead className="text-right">Thrift Fund (TF)</TableHead>
                  <TableHead className="text-right font-bold">Total</TableHead>
                  <TableHead className="w-[100px] text-center">Options</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row) => {
                  const override = overrides[row.userId];
                  return (
                    <TableRow key={row.userId} className={override ? "bg-accent/40" : ""}>
                      <TableCell>{row.slNo}</TableCell>
                      <TableCell>{row.membershipNumber}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1 items-start">
                          <Link href={`/admin/users/${row.userId}`} className="text-primary hover:underline font-semibold">
                            {row.name}
                          </Link>
                          {override && (
                            <Badge variant="outline" className="capitalize text-[10px] py-0 px-1.5 h-4 border-primary bg-primary/5">
                              {override.pauseDeduction && "Paused"}
                              {override.stopPrincipal && "Principal Stopped"}
                              {!override.pauseDeduction && !override.stopPrincipal && "Modified"}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{row.bankAccountNumber}</TableCell>
                      <TableCell className="text-right">₹{row.loanPrincipalPayment.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                          <InterestBreakdownPopover
                              loanBreakdown={row.loanBreakdown}
                              totalInterest={row.loanInterestPayment}
                              userId={row.userId}
                          />
                      </TableCell>
                      <TableCell className="text-right">₹{row.shareFundContribution.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{row.thriftFundContribution.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold text-foreground">₹{row.totalDeduction.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => openOverrideDialog(row)}>
                          <Edit2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow className="font-bold text-base bg-muted/50 hover:bg-muted/50">
                  <TableCell colSpan={4}>Totals</TableCell>
                  <TableCell className="text-right text-foreground">₹{totals.principal.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-foreground">₹{totals.interest.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-foreground">₹{totals.share.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-foreground">₹{totals.thrift.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-bold text-foreground">₹{totals.total.toLocaleString()}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Override Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Deduction Options</DialogTitle>
            <DialogDescription>
              Configure deduction settings for <strong>{editingRow?.name}</strong> for the month of <strong>{monthName}, {selectedYear}</strong>.
            </DialogDescription>
          </DialogHeader>

          {editingRow && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Deduction Mode</Label>
                <RadioGroup
                  value={overrideMode}
                  onValueChange={(val: any) => setOverrideMode(val)}
                  className="grid grid-cols-2 gap-3"
                >
                  <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-accent/40 cursor-pointer">
                    <RadioGroupItem value="default" id="mode-default" />
                    <Label htmlFor="mode-default" className="cursor-pointer font-medium">Default</Label>
                  </div>
                  <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-accent/40 cursor-pointer border-destructive/30">
                    <RadioGroupItem value="pause" id="mode-pause" />
                    <Label htmlFor="mode-pause" className="cursor-pointer font-medium text-destructive">Pause All</Label>
                  </div>
                  <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-accent/40 cursor-pointer">
                    <RadioGroupItem value="stop_loan_principal" id="mode-stop-loan-principal" />
                    <Label htmlFor="mode-stop-loan-principal" className="cursor-pointer font-medium">Stop Loan Principal</Label>
                  </div>
                  <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-accent/40 cursor-pointer">
                    <RadioGroupItem value="custom" id="mode-custom" />
                    <Label htmlFor="mode-custom" className="cursor-pointer font-medium">Custom Override</Label>
                  </div>
                </RadioGroup>
              </div>

              {overrideMode === "custom" && (
                <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
                  <div className="space-y-1 bg-primary/5 p-3 rounded-lg border border-primary/20">
                    <Label htmlFor="custom-total" className="text-primary font-semibold flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                      Custom Total Deduction (₹)
                    </Label>
                    <Input
                      id="custom-total"
                      type="number"
                      value={customTotal}
                      onChange={(e) => handleCustomTotalChange(e.target.value)}
                      placeholder="Enter total to automatically distribute"
                      min="0"
                      step="1"
                      className="border-primary/30 focus-visible:ring-primary font-bold"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Entering a total will automatically distribute it first to Interest, then Principal, and then Thrift Fund.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="custom-thrift">Thrift Fund Contribution (₹)</Label>
                    <Input
                      id="custom-thrift"
                      type="number"
                      value={customThrift}
                      onChange={(e) => setCustomThrift(e.target.value)}
                      min="0"
                      step="1"
                    />
                  </div>

                  {editingRow.loanDetails && (
                    <>
                      <div className="space-y-1">
                        <Label htmlFor="custom-principal">Loan Principal Payment (₹)</Label>
                        <Input
                          id="custom-principal"
                          type="number"
                          value={customPrincipal}
                          onChange={(e) => setCustomPrincipal(e.target.value)}
                          min="0"
                          max={editingRow.loanDetails.outstandingPrincipal}
                          step="1"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Max allowed: ₹{editingRow.loanDetails.outstandingPrincipal.toLocaleString()} (Outstanding Principal)
                        </p>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="custom-interest">Loan Interest Payment (₹)</Label>
                        <Input
                          id="custom-interest"
                          type="number"
                          value={customInterest}
                          onChange={(e) => setCustomInterest(e.target.value)}
                          min="0"
                          step="1"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveOverrides}>
              Apply Overrides
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
