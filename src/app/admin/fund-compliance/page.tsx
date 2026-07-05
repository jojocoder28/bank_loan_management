"use client";

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useTransition } from "react";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    AlertTriangle, CheckCircle2, Loader2, RefreshCw, ShieldAlert,
    Users, Zap, ChevronsUp, IndianRupee,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    getFundComplianceData,
    minimumTopUpUser,
    customTopUpUser,
    bulkMinimumTopUp,
    autoAdjustAllFunds,
    ComplianceRow,
} from "./actions";
import { cn } from "@/lib/utils";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function FundCompliancePage() {
    const [rows, setRows] = useState<ComplianceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    const [isPending, startTransition] = useTransition();

    // Custom top-up dialog state
    const [customDialog, setCustomDialog] = useState<{ open: boolean; userId: string; name: string } | null>(null);
    const [customAmount, setCustomAmount] = useState("");
    const [customNote, setCustomNote] = useState("");

    const loadData = () => {
        setLoading(true);
        getFundComplianceData().then(data => {
            setRows(data);
            setLoading(false);
        });
    };

    useEffect(() => { loadData(); }, []);

    const showToast = (type: "success" | "error", msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 5000);
    };

    const handleSingleMinimum = (userId: string) => {
        startTransition(async () => {
            const res = await minimumTopUpUser(userId);
            if (res.success) showToast("success", res.success);
            else showToast("error", res.error!);
            loadData();
        });
    };

    const handleCustomTopUp = () => {
        if (!customDialog) return;
        const amount = parseInt(customAmount, 10);
        if (!amount || amount <= 0) { showToast("error", "Enter a valid positive amount."); return; }
        startTransition(async () => {
            const res = await customTopUpUser(customDialog.userId, amount, customNote || undefined);
            if (res.success) showToast("success", res.success);
            else showToast("error", res.error!);
            setCustomDialog(null);
            setCustomAmount("");
            setCustomNote("");
            loadData();
        });
    };

    const handleBulkTopUp = () => {
        if (selected.size === 0) return;
        startTransition(async () => {
            const res = await bulkMinimumTopUp(Array.from(selected));
            if (res.success) showToast("success", res.success);
            else showToast("error", res.error!);
            setSelected(new Set());
            loadData();
        });
    };

    const handleAutoAdjust = () => {
        startTransition(async () => {
            const res = await autoAdjustAllFunds();
            if (res.success) showToast("success", res.success);
            else showToast("error", res.error!);
            setSelected(new Set());
            loadData();
        });
    };

    const toggleSelect = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        const nonCompliant = rows.filter(r => !r.compliance.isCompliant).map(r => r.userId);
        if (selected.size === nonCompliant.length) setSelected(new Set());
        else setSelected(new Set(nonCompliant));
    };

    const compliantCount = rows.filter(r => r.compliance.isCompliant).length;
    const nonCompliantCount = rows.length - compliantCount;
    const nonCompliantRows = rows.filter(r => !r.compliance.isCompliant);
    const allNonCompliantSelected = nonCompliantCount > 0 && selected.size === nonCompliantCount;

    return (
        <div className="flex flex-col gap-6">
            {/* Toast */}
            {toast && (
                <div className={cn(
                    "fixed top-4 right-4 z-50 max-w-sm rounded-xl px-4 py-3 shadow-xl text-sm font-medium flex items-start gap-2",
                    toast.type === "success"
                        ? "bg-green-600 text-white"
                        : "bg-destructive text-destructive-foreground"
                )}>
                    {toast.type === "success" ? <CheckCircle2 className="size-4 mt-0.5 shrink-0" /> : <AlertTriangle className="size-4 mt-0.5 shrink-0" />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ShieldAlert className="size-6 text-primary" />
                        SF/GF Fund Compliance
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Members must maintain SF + GF ≥ 5% of their total active loan principal.
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={loadData} disabled={loading || isPending}>
                        <RefreshCw className={cn("size-4 mr-2", loading && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleAutoAdjust}
                        disabled={isPending || loading || nonCompliantCount === 0}
                        id="auto-adjust-all-btn"
                    >
                        {isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Zap className="size-4 mr-2" />}
                        Auto-Adjust All
                    </Button>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary/10 rounded-xl"><Users className="size-5 text-primary" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground">Total Members</p>
                                <p className="text-2xl font-bold">{rows.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-green-500/10 rounded-xl"><CheckCircle2 className="size-5 text-green-500" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground">Compliant</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{compliantCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-500/10 rounded-xl"><AlertTriangle className="size-5 text-amber-500" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground">Non-Compliant</p>
                                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{nonCompliantCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bulk actions bar */}
            {selected.size > 0 && (
                <Alert className="border-primary/30 bg-primary/5">
                    <ChevronsUp className="size-4 text-primary" />
                    <AlertTitle>{selected.size} member(s) selected</AlertTitle>
                    <AlertDescription className="flex items-center gap-3 mt-2 flex-wrap">
                        <Button size="sm" onClick={handleBulkTopUp} disabled={isPending}>
                            {isPending ? <Loader2 className="size-3 mr-1.5 animate-spin" /> : null}
                            Top Up Minimum for Selected
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setSelected(new Set())}>
                            Clear Selection
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Member Fund Compliance Status</CardTitle>
                    <CardDescription>
                        Non-compliant members are shown first. Top up individual members or use bulk actions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
                            <Loader2 className="size-5 animate-spin" />
                            <span>Loading compliance data…</span>
                        </div>
                    ) : rows.length === 0 ? (
                        <p className="text-center text-muted-foreground py-12">No active members found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10">
                                            <Checkbox
                                                checked={allNonCompliantSelected}
                                                onCheckedChange={toggleAll}
                                                aria-label="Select all non-compliant"
                                            />
                                        </TableHead>
                                        <TableHead>Member</TableHead>
                                        <TableHead className="text-right">Loan Principal</TableHead>
                                        <TableHead className="text-right">Required (5%)</TableHead>
                                        <TableHead className="text-right">SF Balance</TableHead>
                                        <TableHead className="text-right">GF Balance</TableHead>
                                        <TableHead className="text-right">Current Total</TableHead>
                                        <TableHead className="text-right">Shortfall</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map(row => {
                                        const { compliance } = row;
                                        return (
                                            <TableRow
                                                key={row.userId}
                                                className={cn(
                                                    !compliance.isCompliant && "bg-amber-50/50 dark:bg-amber-900/10"
                                                )}
                                            >
                                                <TableCell>
                                                    {!compliance.isCompliant && (
                                                        <Checkbox
                                                            checked={selected.has(row.userId)}
                                                            onCheckedChange={() => toggleSelect(row.userId)}
                                                            aria-label={`Select ${row.name}`}
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{row.name}</p>
                                                        <p className="text-xs text-muted-foreground">{row.membershipNumber}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm">
                                                    ₹{row.totalActiveLoanPrincipal.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm font-semibold">
                                                    ₹{compliance.required.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm">
                                                    ₹{row.shareFund.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm">
                                                    ₹{row.guaranteedFund.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm">
                                                    ₹{compliance.current.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm">
                                                    {compliance.shortfall > 0 ? (
                                                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                                            ₹{compliance.shortfall.toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {compliance.isCompliant ? (
                                                        <Badge className="bg-green-600/15 text-green-700 dark:text-green-400 border-green-600/30 hover:bg-green-600/20">
                                                            <CheckCircle2 className="size-3 mr-1" />Compliant
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-400 bg-amber-500/10">
                                                            <AlertTriangle className="size-3 mr-1" />Deficit
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {!compliance.isCompliant ? (
                                                        <div className="flex gap-1.5 justify-end flex-wrap">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-xs h-7 px-2"
                                                                disabled={isPending}
                                                                onClick={() => handleSingleMinimum(row.userId)}
                                                                id={`min-topup-${row.userId}`}
                                                            >
                                                                <ChevronsUp className="size-3 mr-1" />
                                                                Min (₹{compliance.shortfall.toLocaleString()})
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-xs h-7 px-2"
                                                                disabled={isPending}
                                                                onClick={() => setCustomDialog({ open: true, userId: row.userId, name: row.name })}
                                                                id={`custom-topup-${row.userId}`}
                                                            >
                                                                <IndianRupee className="size-3 mr-1" />Custom
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Custom Top-Up Dialog */}
            <Dialog open={!!customDialog?.open} onOpenChange={open => !open && setCustomDialog(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Custom Fund Top-Up</DialogTitle>
                        <DialogDescription>
                            Top up SF/GF for <strong>{customDialog?.name}</strong>. The amount will be split 50/50 between Share Fund and Guaranteed Fund.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="custom-amount">Top-Up Amount (₹)</Label>
                            <Input
                                id="custom-amount"
                                type="number"
                                min={1}
                                placeholder="e.g. 5000"
                                value={customAmount}
                                onChange={e => setCustomAmount(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="custom-note">Note (optional)</Label>
                            <Textarea
                                id="custom-note"
                                placeholder="Reason for top-up…"
                                rows={2}
                                value={customNote}
                                onChange={e => setCustomNote(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCustomDialog(null)}>Cancel</Button>
                        <Button onClick={handleCustomTopUp} disabled={isPending}>
                            {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                            Apply Top-Up
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
