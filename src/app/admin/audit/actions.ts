"use server";

import { z } from "zod";
import { auditDataAnalysis } from "@/ai/flows/audit-data-analysis";

const schema = z.object({
  currentBalanceSheetData: z.string().min(1, "Current data is required."),
  historicalBalanceSheetData: z.string().min(1, "Historical data is required."),
  discrepancyThreshold: z.coerce
    .number()
    .min(0, "Threshold must be non-negative."),
});

export async function runAudit(prevState: any, formData: FormData) {
  const validatedFields = schema.safeParse({
    currentBalanceSheetData: formData.get("currentBalanceSheetData"),
    historicalBalanceSheetData: formData.get("historicalBalanceSheetData"),
    discrepancyThreshold: formData.get("discrepancyThreshold"),
  });

  if (!validatedFields.success) {
    return {
      analysisResult: "",
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  // Validate JSON format
  try {
    JSON.parse(validatedFields.data.currentBalanceSheetData);
    JSON.parse(validatedFields.data.historicalBalanceSheetData);
  } catch (e) {
    return {
      analysisResult: "",
      error: "Invalid JSON format provided.",
    };
  }

  try {
    const result = await auditDataAnalysis(validatedFields.data);
    return {
      analysisResult: result.analysisResult,
      error: null,
    };
  } catch (error) {
    console.error("AI Audit Error:", error);
    return {
      analysisResult: "",
      error: "An unexpected error occurred during the audit.",
    };
  }
}
