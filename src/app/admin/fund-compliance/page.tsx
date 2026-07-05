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
    Users, Zap, ChevronsUp, IndianRupee, XCircle,
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

function ComplianceBadge({ isCompliant, label }: { isCompliant: boolean; label?: string }) {
    return isCompliant ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
            <CheckCircle2 className="size-3.5" />{label ?? "OK"}
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
            <XCircle className="size-3.5" />{label ?? "Deficit"}
        </span>
    );
}

export default function FundCompliancePage() {
    const [rows, setRows] = useState<ComplianceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
    const [isPending, startTransition] = useTransition();

    const [customDialog, setCustomDialog] = useState<{ open: boolean; userId: string; name: string; sfShortfall: number; gfShortfall: number } | null>(null);
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
    const allNonCompliantSelected = nonCompliantCount > 0 && selected.size === nonCompliantCount;

    return (
        <div className="flex flex-col gap-6">
            {/* Toast */}
            {toast && (
                <div className={cn(
                    "fixed top-4 right-4 z-50 max-w-sm rounded-xl px-4 py-3 shadow-xl text-sm font-medium flex items-start gap-2",
                    toast.type === "success" ? "bg-green-600 text-white" : "bg-destructive text-destructive-foreground"
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
                        Each fund is checked independently: <strong>Share Fund ≥ 5%</strong> of loan principal <strong>AND Guaranteed Fund ≥ 5%</strong> of loan principal.
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

            {/* Rule explanation */}
            <Alert className="border-primary/30 bg-primary/5">
                <ShieldAlert className="size-4 text-primary" />
                <AlertTitle className="text-primary">Compliance Rule</AlertTitle>
                <AlertDescription className="text-sm">
                    <strong>Share Fund</strong> must be ≥ 5% of total active loan principal <em>independently</em>.
                    <strong> Guaranteed Fund</strong> must also be ≥ 5% <em>independently</em>.
                    A member needs both funds to be compliant. A surplus in one fund does <em>not</em> offset a deficit in the other.
                </AlertDescription>
            </Alert>

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
                                <p className="text-xs text-muted-foreground">Fully Compliant (SF+GF)</p>
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
                                <p className="text-xs text-muted-foreground">Need Top-Up</p>
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
                        Non-compliant members shown first. SF and GF are each checked independently against 5% of loan principal.
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
                                        <TableHead className="text-right">Req. per Fund (5%)</TableHead>
                                        <TableHead className="text-right">Share Fund</TableHead>
                                        <TableHead className="text-center">SF Status</TableHead>
                                        <TableHead className="text-right">Guaranteed Fund</TableHead>
                                        <TableHead className="text-center">GF Status</TableHead>
                                        <TableHead className="text-right">SF Shortfall</TableHead>
                                        <TableHead className="text-right">GF Shortfall</TableHead>
                                        <TableHead className="text-center">Overall</TableHead>
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
                                                    ₹{compliance.requiredSf.toLocaleString()}
                                                </TableCell>
                                                {/* SF */}
                                                <TableCell className="text-right font-mono text-sm">
                                                    ₹{compliance.currentSf.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <ComplianceBadge isCompliant={compliance.isSfCompliant} />
                                                </TableCell>
                                                {/* GF */}
                                                <TableCell className="text-right font-mono text-sm">
                                                    ₹{compliance.currentGf.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <ComplianceBadge isCompliant={compliance.isGfCompliant} />
                                                </TableCell>
                                                {/* Shortfalls */}
                                                <TableCell className="text-right font-mono text-sm">
                                                    {compliance.sfShortfall > 0 ? (
                                                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                                            ₹{compliance.sfShortfall.toLocaleString()}
                                                        </span>
                                                    ) : <span className="text-muted-foreground">—</span>}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm">
                                                    {compliance.gfShortfall > 0 ? (
                                                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                                            ₹{compliance.gfShortfall.toLocaleString()}
                                                        </span>
                                                    ) : <span className="text-muted-foreground">—</span>}
                                                </TableCell>
                                                {/* Overall */}
                                                <TableCell className="text-center">
                                                    {compliance.isCompliant ? (
                                                        <Badge className="bg-green-600/15 text-green-700 dark:text-green-400 border-green-600/30 hover:bg-green-600/20">
                                                            <CheckCircle2 className="size-3 mr-1" />Compliant
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-400 bg-amber-500/10">
                                                            <AlertTriangle className="size-3 mr-1" />
                                                            {!compliance.isSfCompliant && !compliance.isGfCompliant ? "SF+GF" : !compliance.isSfCompliant ? "SF" : "GF"} Deficit
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                {/* Actions */}
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
                                                                Min (₹{compliance.totalShortfall.toLocaleString()})
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-xs h-7 px-2"
                                                                disabled={isPending}
                                                                onClick={() => setCustomDialog({ open: true, userId: row.userId, name: row.name, sfShortfall: compliance.sfShortfall, gfShortfall: compliance.gfShortfall })}
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
                            Top up for <strong>{customDialog?.name}</strong>. Funds are allocated to whichever is deficient first (SF then GF).
                        </DialogDescription>
                    </DialogHeader>
                    {customDialog && (
                        <div className="grid gap-3 py-2 text-sm">
                            <div className="flex justify-between p-2 rounded-lg bg-muted/50">
                                <span className="text-muted-foreground">SF shortfall</span>
                                <span className={cn("font-semibold", customDialog.sfShortfall > 0 ? "text-amber-600 dark:text-amber-400" : "text-green-600")}>
                                    {customDialog.sfShortfall > 0 ? `₹${customDialog.sfShortfall.toLocaleString()}` : "✓ Compliant"}
                                </span>
                            </div>
                            <div className="flex justify-between p-2 rounded-lg bg-muted/50">
                                <span className="text-muted-foreground">GF shortfall</span>
                                <span className={cn("font-semibold", customDialog.gfShortfall > 0 ? "text-amber-600 dark:text-amber-400" : "text-green-600")}>
                                    {customDialog.gfShortfall > 0 ? `₹${customDialog.gfShortfall.toLocaleString()}` : "✓ Compliant"}
                                </span>
                            </div>
                        </div>
                    )}
                    <div className="grid gap-4">
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
                            <p className="text-xs text-muted-foreground">Amount is applied to SF first until compliant, then to GF.</p>
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
