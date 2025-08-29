"use server";

import { z } from "zod";
import { auditDataAnalysis } from "@/ai/flows/audit-data-analysis";

const schema = z.object({
  context: z.string().min(1, "Please provide some context or a question."),
  file: z.any().optional(),
});

export async function runAudit(prevState: any, formData: FormData) {
  const validatedFields = schema.safeParse({
    context: formData.get("context"),
    file: formData.get("file"),
  });

  if (!validatedFields.success) {
    return {
      analysisResult: "",
      error: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { context, file } = validatedFields.data;
  let dataUri: string | undefined = undefined;

  if (file && file.size > 0) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit for Gemini
           return {
                analysisResult: "",
                error: "File size cannot exceed 4MB.",
            };
      }
      try {
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        dataUri = `data:${file.type};base64,${fileBuffer.toString('base64')}`;
      } catch (e) {
          return {
            analysisResult: "",
            error: "Could not process the uploaded file.",
        };
      }
  }


  try {
    const result = await auditDataAnalysis({ context, dataUri });
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
