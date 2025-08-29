
"use client";

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
import { runAudit } from "./actions";
import { Loader2, Sparkles, FileUp, X, File as FileIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";


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
  const [state, formAction] = useActionState(runAudit, initialState);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filePreview, setFilePreview] = useState<{name: string, type: string, url: string} | null>(null);

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
  }

  const { pending } = useFormStatus();

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>AI Data Analyst</CardTitle>
          <CardDescription>
            Upload a file (image, document, csv) and ask a question to get AI-powered insights.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
                <Label htmlFor="context">
                    Context or Question
                </Label>
                <Textarea
                    id="context"
                    name="context"
                    placeholder="e.g., What are the key takeaways from this document? or Is there anything unusual in this balance sheet image?"
                    rows={5}
                    required
                />
            </div>
            
            <div className="grid gap-2">
                <Label htmlFor="file-upload">Upload File (Optional)</Label>
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

            <SubmitButton />
          </CardContent>
        </form>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Analysis Result</CardTitle>
          <CardDescription>
            AI-powered insights into your provided data.
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
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-sans">
              {state.analysisResult}
            </div>
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
  );
}
