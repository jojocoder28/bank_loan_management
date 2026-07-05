"use client";

export const dynamic = 'force-dynamic';

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { runAudit, getAuditLogs } from "./actions";
import { Loader2, Sparkles, FileUp, X, File as FileIcon, Search, RefreshCw, Activity, Users, Landmark } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { marked } from "marked";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const initialState = {
  analysisResult: "",
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <Loader2 className="mr-2 animate-spin" />
      ) : (
        <Sparkles className="mr-2" />
      )}
      Run Analysis
    </Button>
  );
}

export default function AiAuditPage() {
  // AI Analyst state
  const [state, formAction] = useActionState(runAudit, initialState);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filePreview, setFilePreview] = useState<{name: string, type: string, url: string} | null>(null);

  // System Audit Logs state
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const data = await getAuditLogs(filterAction, searchQuery);
      setLogs(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load audit logs",
        description: "An unexpected error occurred while fetching log records.",
      });
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterAction]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  useEffect(() => {
    if (state.error) {
       const errorMsg = typeof state.error === 'object' 
        ? Object.values(state.error).flat().join(', ')
        : state.error;
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: errorMsg,
      });
    }
  }, [state.error, toast]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFilePreview({ name: file.name, type: file.type, url });
    }
  };

  const handleRemoveFile = () => {
    setFilePreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const getActionBadge = (action: string) => {
    const successActions = ['LOAN_APPROVED', 'MONTHLY_DEDUCTION_PROCESSED', 'MEMBERSHIP_APPROVED', 'MODIFICATION_APPROVED'];
    const infoActions = ['LOAN_APPLIED', 'LOAN_APPLIED_ON_BEHALF', 'ONBOARDING_EMAIL_SENT', 'ONBOARDING_BULK_EMAILS_SENT'];
    const dangerActions = ['LOAN_REJECTED', 'MONTHLY_DEDUCTION_UNDONE', 'PASSWORD_RESET', 'MEMBERSHIP_REJECTED', 'MODIFICATION_REJECTED'];
    
    let colorClass = "border-muted-foreground text-muted-foreground";

    if (successActions.includes(action)) {
      colorClass = "bg-green-500/10 text-green-500 border-green-500/30";
    } else if (infoActions.includes(action)) {
      colorClass = "bg-blue-500/10 text-blue-500 border-blue-500/30";
    } else if (dangerActions.includes(action)) {
      colorClass = "bg-rose-500/10 text-rose-500 border-rose-500/30";
    }

    return (
      <Badge variant="outline" className={`capitalize font-semibold text-[10px] px-2 py-0.5 tracking-wide ${colorClass}`}>
        {action.toLowerCase().replace(/_/g, ' ')}
      </Badge>
    );
  };

  const { pending } = useFormStatus();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit & Analytics</h1>
          <p className="text-muted-foreground">Monitor system audits, traceability trails, and verify financial statements.</p>
        </div>
      </div>

      <Tabs defaultValue="trails" className="space-y-4">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="trails">System Audit Trails</TabsTrigger>
          <TabsTrigger value="analyst">AI Data Analyst</TabsTrigger>
        </TabsList>

        {/* Tab 1: System Audit Trails */}
        <TabsContent value="trails" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>System Traceability Log</CardTitle>
                  <CardDescription>Review all chronological administrative changes, loan application events, password resets, and monthly updates.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchLogs} disabled={logsLoading} className="gap-1.5 self-end md:self-auto">
                  <RefreshCw className={`size-3.5 ${logsLoading ? "animate-spin" : ""}`} />
                  Refresh Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 mb-6">
                <div className="w-full md:w-[220px]">
                  <Select value={filterAction} onValueChange={setFilterAction}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="LOAN_APPLIED">Loan Applied (Member)</SelectItem>
                      <SelectItem value="LOAN_APPLIED_ON_BEHALF">Loan Applied (Admin)</SelectItem>
                      <SelectItem value="LOAN_APPROVED">Loan Approved</SelectItem>
                      <SelectItem value="LOAN_REJECTED">Loan Rejected</SelectItem>
                      <SelectItem value="MEMBERSHIP_APPROVED">Membership Approved</SelectItem>
                      <SelectItem value="MEMBERSHIP_REJECTED">Membership Rejected</SelectItem>
                      <SelectItem value="MODIFICATION_APPROVED">Payment Approved</SelectItem>
                      <SelectItem value="MODIFICATION_REJECTED">Payment Rejected</SelectItem>
                      <SelectItem value="MONTHLY_DEDUCTION_PROCESSED">Deductions Processed</SelectItem>
                      <SelectItem value="MONTHLY_DEDUCTION_UNDONE">Deductions Undone</SelectItem>
                      <SelectItem value="PASSWORD_RESET">Password Reset</SelectItem>
                      <SelectItem value="ONBOARDING_EMAIL_SENT">Onboarding Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search logs by actor or description details..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button type="submit">Search</Button>
                </div>
              </form>

              {/* Data Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/55">
                      <TableHead className="w-[180px]">Timestamp</TableHead>
                      <TableHead className="w-[170px]">Action Type</TableHead>
                      <TableHead className="w-[180px]">Actor</TableHead>
                      <TableHead className="w-[180px]">Affected Member</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsLoading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <TableRow key={idx}>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-5/6" /></TableCell>
                        </TableRow>
                      ))
                    ) : logs.length > 0 ? (
                      logs.map((log) => (
                        <TableRow key={log._id} className="hover:bg-muted/20">
                          <TableCell className="text-muted-foreground text-xs font-mono">
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>{getActionBadge(log.action)}</TableCell>
                          <TableCell className="font-medium text-xs truncate max-w-[180px]" title={log.actor}>
                            {log.actor}
                          </TableCell>
                          <TableCell>
                            {log.targetUser ? (
                              <Link
                                href={`/admin/users/${log.targetUser._id}`}
                                className="text-primary text-xs hover:underline block font-semibold"
                              >
                                {log.targetUser.name}
                                <span className="text-[10px] text-muted-foreground font-normal block font-mono">
                                  #{log.targetUser.membershipNumber || "Pending"}
                                </span>
                              </Link>
                            ) : (
                              <span className="text-muted-foreground text-xs">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-foreground font-sans max-w-xs md:max-w-md break-words">
                            {log.details}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          No audit trail records found matching your filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: AI Data Analyst */}
        <TabsContent value="analyst" className="space-y-4">
          <div className="grid gap-8 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>AI Data Analyst</CardTitle>
                <CardDescription>
                  Upload a file (e.g., balance sheet, statement, receipt) and the AI will automatically perform a financial audit.
                </CardDescription>
              </CardHeader>
              <form action={formAction}>
                <CardContent className="grid gap-6">

                  <div className="grid gap-2">
                      <Label htmlFor="file-upload">Upload File</Label>
                      <Input id="file-upload" name="file" type="file" ref={fileInputRef} onChange={handleFileChange} />
                      <p className="text-xs text-muted-foreground">Supports: Images, PDF, DOCX, CSV. Max 4MB.</p>
                  </div>

                  {filePreview && (
                      <div className="relative rounded-lg border p-4">
                          <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute -top-3 -right-3 size-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80"
                              onClick={handleRemoveFile}
                          >
                             <X className="size-4" />
                             <span className="sr-only">Remove file</span>
                          </Button>
                          {filePreview.type.startsWith("image/") ? (
                              <Image src={filePreview.url} alt="File preview" width={100} height={100} className="rounded-md object-cover h-24 w-24" />
                          ) : (
                             <div className="flex flex-col items-center justify-center text-center p-4 bg-secondary rounded-md">
                                  <FileIcon className="size-8 text-muted-foreground" />
                                  <p className="text-sm font-medium truncate max-w-full">{filePreview.name}</p>
                                  <p className="text-xs text-muted-foreground">{filePreview.type}</p>
                             </div>
                          )}
                      </div>
                  )}
                  
                   <div className="grid gap-2">
                      <Label htmlFor="context">
                          Specific questions or focus areas (Optional)
                      </Label>
                      <Textarea
                          id="context"
                          name="context"
                          placeholder="e.g., 'Focus on the expense column and check for inconsistencies' or 'Are the totals calculated correctly?'"
                          rows={4}
                      />
                  </div>

                  <SubmitButton />
                </CardContent>
              </form>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Analysis Result</CardTitle>
                <CardDescription>
                  AI-powered audit and insights into your provided data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pending ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : state.analysisResult ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: marked.parse(state.analysisResult) }}
                  />
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Sparkles className="mx-auto h-12 w-12 " />
                    <p className="mt-4">
                      Your analysis results will appear here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
