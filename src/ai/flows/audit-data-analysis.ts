
'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing various data inputs (text, documents, images) to provide AI-powered insights.
 *
 * - auditDataAnalysis - The function to trigger the data analysis flow.
 * - AuditDataAnalysisInput - The input type for the auditDataAnalysis function.
 * - AuditDataAnalysisOutput - The return type for the auditDataAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AuditDataAnalysisInputSchema = z.object({
  context: z
    .string()
    .optional()
    .describe('Optional: Specific questions or a focus area for the analysis.'),
  dataUri: z
    .string()
    .optional()
    .describe(
      "A file (like an image, PDF, or CSV) to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AuditDataAnalysisInput = z.infer<typeof AuditDataAnalysisInputSchema>;

const AuditDataAnalysisOutputSchema = z.object({
  analysisResult: z
    .string()
    .describe(
      'A detailed analysis of the provided data, answering the user\'s query and highlighting important insights.'
    ),
});
export type AuditDataAnalysisOutput = z.infer<typeof AuditDataAnalysisOutputSchema>;

export async function auditDataAnalysis(input: AuditDataAnalysisInput): Promise<AuditDataAnalysisOutput> {
  return auditDataAnalysisFlow(input);
}

const auditDataAnalysisPrompt = ai.definePrompt({
  name: 'auditDataAnalysisPrompt',
  input: {schema: AuditDataAnalysisInputSchema},
  output: {schema: AuditDataAnalysisOutputSchema},
  prompt: `You are an expert financial auditor AI for a cooperative bank. Your primary task is to conduct a detailed audit of the provided document or data.

**Your Mandate:**
1.  **Identify Document Type:** First, identify the type of document provided (e.g., Balance Sheet, Monthly Statement, Receipt, CSV data, etc.).
2.  **Conduct Comprehensive Analysis:** Perform a thorough financial audit. Check for correctness, completeness, and consistency.
    *   Verify all calculations (sums, differences, percentages).
    *   Look for anomalies, outliers, or figures that deviate from typical patterns.
    *   Cross-reference data points for consistency.
    *   Ensure the data aligns with standard accounting principles.
3.  **Address User's Focus (if provided):** If the user has provided a specific question or context, address it directly within your analysis. If not, proceed with a general, unsolicited audit.
4.  **Structure Your Report:** Present your findings in a clear, professional, and structured markdown format.
    *   Start with a title and a summary of the document.
    *   Use headings, bullet points, and bold text to organize your analysis.
    *   Clearly list any identified issues, errors, or anomalies under a "Key Findings & Potential Issues" section.
    *   Conclude with a summary of the overall health or status of the document.

**Data for Analysis:**
{{#if dataUri}}
Attached File Data:
{{media url=dataUri}}
{{else}}
User provided text data.
{{/if}}

{{#if context}}
**User's Specific Focus:**
{{{context}}}
{{/if}}

Begin your full, structured analysis below.
`,
});

const auditDataAnalysisFlow = ai.defineFlow(
  {
    name: 'auditDataAnalysisFlow',
    inputSchema: AuditDataAnalysisInputSchema,
    outputSchema: AuditDataAnalysisOutputSchema,
  },
  async input => {
    // If no file and no context is provided, it's an invalid request.
    if (!input.dataUri && !input.context) {
        throw new Error("You must provide a file or some text to analyze.");
    }
    const {output} = await auditDataAnalysisPrompt(input);
    return output!;
  }
);
