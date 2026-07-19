import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getReportsArchive } from "../statement/actions";
import { FileText, FileSpreadsheet, Calendar, Archive, Download } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Processed Reports Archive - SKGPPST Co-op",
    description: "Access historical processed monthly statements, yearly dues, and dividend report files."
};

function getReportBadge(type: string) {
    switch (type) {
        case 'monthly_statement':
            return <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 text-white border-none text-[10px]">Monthly Statement</Badge>;
        case 'yearly_dues':
            return <Badge variant="secondary" className="bg-emerald-600 hover:bg-emerald-700 text-white border-none text-[10px]">Yearly Dues</Badge>;
        case 'dividend':
            return <Badge variant="outline" className="bg-amber-600 hover:bg-amber-700 text-white border-none text-[10px]">Dividend Report</Badge>;
        default:
            return <Badge variant="outline" className="text-[10px]">{type}</Badge>;
    }
}

function getMonthName(monthIdx: number | undefined) {
    if (monthIdx === undefined) return "";
    return new Date(2000, monthIdx, 1).toLocaleString('default', { month: 'long' });
}

export default async function ReportsPage() {
    const reports = await getReportsArchive();

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                        <Archive className="size-5" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: "Sora, sans-serif" }}>
                            Reports Archive
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Access secure, cloud-stored PDF and CSV copies of finalized statements, dues, and dividends.
                        </p>
                    </div>
                </div>
            </div>

            {reports.length === 0 ? (
                <Card className="max-w-md mx-auto text-center py-12">
                    <CardHeader className="pb-2">
                        <div className="mx-auto flex items-center justify-center size-12 rounded-full bg-muted text-muted-foreground mb-4">
                            <Archive className="size-6" />
                        </div>
                        <CardTitle className="text-lg">No Processed Reports Yet</CardTitle>
                        <CardDescription>
                            Reports are automatically generated and uploaded to Cloudinary whenever you finalize monthly deductions, yearly dues, or dividends.
                        </CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {reports.map((report) => (
                        <Card key={report._id} className="overflow-hidden border border-border/60 hover:border-primary/30 hover:shadow-lg transition-all duration-300 bg-card/60 backdrop-blur-sm">
                            <CardHeader className="pb-3 bg-muted/20 border-b border-border/40">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    {getReportBadge(report.type)}
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground font-semibold">
                                        <Calendar className="size-3.5" />
                                        <span>{report.year}</span>
                                        {report.month !== undefined && <span> - {getMonthName(report.month)}</span>}
                                    </div>
                                </div>
                                <CardTitle className="text-base font-bold line-clamp-1 text-foreground" style={{ fontFamily: "Sora, sans-serif" }}>
                                    {report.title}
                                </CardTitle>
                                <CardDescription className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
                                    Uploaded on {new Date(report.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 flex flex-col gap-3">
                                {report.pdfUrl ? (
                                    <Button asChild variant="outline" className="w-full justify-between h-10 border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/5 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-xl transition-all">
                                        <a href={report.pdfUrl} target="_blank" rel="noopener noreferrer">
                                            <span className="flex items-center gap-2">
                                                <FileText className="size-4 shrink-0" />
                                                Download Statement PDF
                                            </span>
                                            <Download className="size-3.5" />
                                        </a>
                                    </Button>
                                ) : (
                                    <div className="text-xs text-muted-foreground py-2 text-center border border-dashed rounded-xl">
                                        PDF statement file unavailable
                                    </div>
                                )}

                                {report.csvUrl ? (
                                    <Button asChild variant="outline" className="w-full justify-between h-10 border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-xl transition-all">
                                        <a href={report.csvUrl} target="_blank" rel="noopener noreferrer">
                                            <span className="flex items-center gap-2">
                                                <FileSpreadsheet className="size-4 shrink-0" />
                                                Download Excel/CSV
                                            </span>
                                            <Download className="size-3.5" />
                                        </a>
                                    </Button>
                                ) : (
                                    <div className="text-xs text-muted-foreground py-2 text-center border border-dashed rounded-xl">
                                        CSV database file unavailable
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
