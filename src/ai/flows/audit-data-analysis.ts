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
    .describe('The user-provided text, question, or context for the analysis.'),
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
  prompt: `You are an expert AI assistant specialized in data analysis for a cooperative bank.

Your task is to analyze the provided information, which can be text, a document, or an image, and generate a detailed analysis report.
The user will provide a text input which could be a question, a description of the data, or a specific instruction.
They may also provide a file (image, csv, pdf, docx).

Analyze the data thoroughly, answer any questions posed by the user, and provide concise, actionable insights.

User's Input/Question:
{{{context}}}

{{#if dataUri}}
Attached File Data:
{{media url=dataUri}}
{{/if}}

Please provide your full analysis below.
`,
});

const auditDataAnalysisFlow = ai.defineFlow(
  {
    name: 'auditDataAnalysisFlow',
    inputSchema: AuditDataAnalysisInputSchema,
    outputSchema: AuditDataAnalysisOutputSchema,
  },
  async input => {
    const {output} = await auditDataAnalysisPrompt(input);
    return output!;
  }
);
