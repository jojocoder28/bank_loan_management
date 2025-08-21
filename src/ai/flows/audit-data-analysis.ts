'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing balance sheet data against historical data to identify potential discrepancies and anomalies.
 *
 * - auditDataAnalysis - The function to trigger the data analysis flow.
 * - AuditDataAnalysisInput - The input type for the auditDataAnalysis function.
 * - AuditDataAnalysisOutput - The return type for the auditDataAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AuditDataAnalysisInputSchema = z.object({
  currentBalanceSheetData: z
    .string()
    .describe('The current monthly balance sheet data in JSON format.'),
  historicalBalanceSheetData: z
    .string()
    .describe('Historical balance sheet data in JSON format for comparison.'),
  discrepancyThreshold: z
    .number()
    .describe(
      'The percentage threshold above which a discrepancy is considered an anomaly.'
    ),
});
export type AuditDataAnalysisInput = z.infer<typeof AuditDataAnalysisInputSchema>;

const AuditDataAnalysisOutputSchema = z.object({
  analysisResult: z
    .string()
    .describe(
      'A detailed analysis of the balance sheet data, highlighting any discrepancies or anomalies found.'
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
  prompt: `You are an AI assistant specialized in financial auditing.

You are provided with the current monthly balance sheet data and historical balance sheet data.
Your task is to analyze the current data against the historical data to identify any potential discrepancies or anomalies.

A discrepancy is considered an anomaly if it exceeds the specified discrepancy threshold.

Current Balance Sheet Data: {{{currentBalanceSheetData}}}
Historical Balance Sheet Data: {{{historicalBalanceSheetData}}}
Discrepancy Threshold: {{{discrepancyThreshold}}}%

Provide a detailed analysis report highlighting any discrepancies found and whether they exceed the specified threshold. Be concise and provide actionable insights.
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
