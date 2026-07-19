"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DownloadReportButtonProps {
    url: string;
    filename: string;
    label: string;
    icon: React.ReactNode;
    className?: string;
}

export function DownloadReportButton({ url, filename, label, icon, className }: DownloadReportButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Network response was not ok");
            const blob = await response.blob();
            
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Failed to download file:", error);
            window.open(url, "_blank");
            toast({
                variant: "destructive",
                title: "Download Failed",
                description: "Opened file in a new tab instead."
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button 
            onClick={handleDownload} 
            disabled={isLoading}
            variant="outline" 
            className={className}
        >
            <span className="flex items-center gap-2">
                {isLoading ? <Loader2 className="size-4 animate-spin shrink-0" /> : icon}
                {label}
            </span>
            <Download className="size-3.5" />
        </Button>
    );
}
