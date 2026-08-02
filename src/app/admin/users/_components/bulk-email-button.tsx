"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { sendBulkOnboardingEmails, getBulkEmailJobStatus } from "../actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export function BulkEmailButton() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [openModal, setOpenModal] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<{
    status?: string;
    totalCount?: number;
    sentCount?: number;
    failedCount?: number;
    currentRecipient?: string;
    logs?: string[];
    error?: string;
    completedAt?: string;
  } | null>(null);

  // Poll job status every 3 seconds when activeJobId is set and status is in_progress/pending
  useEffect(() => {
    if (!activeJobId || !openModal) return;

    let intervalId: NodeJS.Timeout;

    const fetchStatus = async () => {
      const res = await getBulkEmailJobStatus(activeJobId);
      if (res.jobId) {
        setJobStatus(res);
        if (res.status === 'completed' || res.status === 'failed') {
          clearInterval(intervalId);
        }
      }
    };

    fetchStatus();
    intervalId = setInterval(fetchStatus, 3000);

    return () => clearInterval(intervalId);
  }, [activeJobId, openModal]);

  const handleBulkSend = () => {
    startTransition(async () => {
      try {
        const res = await sendBulkOnboardingEmails();
        if (res.error) {
          toast({
            variant: "destructive",
            title: "Bulk Invites Failed",
            description: res.error
          });
        } else if (res.jobId) {
          setActiveJobId(res.jobId);
          setJobStatus({
            status: 'pending',
            totalCount: res.totalCount || 0,
            sentCount: 0,
            failedCount: 0,
            logs: [`Job initiated for ${res.totalCount} members...`]
          });
          setOpenModal(true);
          toast({
            title: "Background Job Started",
            description: res.success || `Processing emails for ${res.totalCount} members.`
          });
        } else if (res.success) {
          toast({
            title: "Bulk Emails Processed",
            description: res.success
          });
        }
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: err.message || "An unexpected error occurred."
        });
      }
    });
  };

  const processedCount = (jobStatus?.sentCount || 0) + (jobStatus?.failedCount || 0);
  const totalCount = jobStatus?.totalCount || 1;
  const progressPercent = Math.min(100, Math.round((processedCount / totalCount) * 100));

  return (
    <>
      <Button 
        variant="outline" 
        onClick={handleBulkSend} 
        disabled={isPending}
        className="w-full sm:w-auto border-primary/20 hover:bg-primary/5 text-foreground"
      >
        {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Mail className="mr-2 size-4" />}
        Bulk Send Welcome Emails
      </Button>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="size-5 text-primary" />
              Bulk Email Background Job
            </DialogTitle>
            <DialogDescription>
              Sending onboarding credentials using a single pooled SMTP connection with a 4-second delay between emails to comply with Gmail limits.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Status & Counts Header */}
            <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                {jobStatus?.status === 'in_progress' && (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200 animate-pulse">
                    <Loader2 className="mr-1 size-3 animate-spin" />
                    In Progress
                  </Badge>
                )}
                {jobStatus?.status === 'pending' && (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">
                    <RefreshCw className="mr-1 size-3 animate-spin" />
                    Starting...
                  </Badge>
                )}
                {jobStatus?.status === 'completed' && (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                    <CheckCircle2 className="mr-1 size-3" />
                    Completed
                  </Badge>
                )}
                {jobStatus?.status === 'failed' && (
                  <Badge variant="destructive">
                    <AlertCircle className="mr-1 size-3" />
                    Failed
                  </Badge>
                )}
              </div>

              <div className="text-xs font-semibold space-x-3">
                <span className="text-emerald-600">Sent: {jobStatus?.sentCount || 0}</span>
                <span className="text-red-500">Failed: {jobStatus?.failedCount || 0}</span>
                <span className="text-muted-foreground">Total: {jobStatus?.totalCount || 0}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span>Sending Progress ({progressPercent}%)</span>
                <span>{processedCount} of {totalCount} processed</span>
              </div>
              <Progress value={progressPercent} className="h-2.5" />
            </div>

            {/* Current Recipient */}
            {jobStatus?.currentRecipient && jobStatus.status === 'in_progress' && (
              <div className="text-xs bg-blue-50/50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200 p-2.5 rounded border border-blue-200/50 flex items-center gap-2">
                <Loader2 className="size-3.5 animate-spin text-blue-600 shrink-0" />
                <span>Currently sending to: <strong>{jobStatus.currentRecipient}</strong></span>
              </div>
            )}

            {/* Error banner if failed */}
            {jobStatus?.error && (
              <div className="text-xs bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 p-3 rounded border border-red-200">
                <strong>Job Error:</strong> {jobStatus.error}
              </div>
            )}

            {/* Activity Logs */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">Activity Log:</span>
              <div className="bg-slate-950 text-slate-200 font-mono text-xs p-3 rounded-md h-40 overflow-y-auto space-y-1 border border-slate-800">
                {jobStatus?.logs && jobStatus.logs.length > 0 ? (
                  jobStatus.logs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed opacity-90">
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 italic">Waiting for activity logs...</div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant={jobStatus?.status === 'in_progress' ? "outline" : "default"} 
              onClick={() => setOpenModal(false)}
            >
              {jobStatus?.status === 'in_progress' ? 'Run in Background & Close' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
