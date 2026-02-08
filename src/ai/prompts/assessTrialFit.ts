// Prompt: Assess patient-trial fit and generate explainable match reasoning
// Purpose: Evaluate eligibility and provide transparent explanations for clinicians

import type { PatientProfile } from '@/types';

export const assessTrialFitPrompt = `Assess patient eligibility for clinical trial. Return ONLY raw JSON (no markdown, no code blocks, no backticks) with these exact fields: matchScore (number 0-100), confidenceLevel (string: high/medium/low), inclusionMatches (array of strings), exclusionFlags (array of strings), uncertainFactors (array of strings), explanation (string), questionsToAsk (array of strings). Use exclusionFlags ONLY for confirmed exclusions explicitly stated in the patient data. Put anything unknown/uncertain into uncertainFactors and questionsToAsk. Do NOT cap matchScore for unknowns; only cap (max 25) when there is at least one confirmed exclusion. Start response with { and end with }.

Patient and criteria:`;

export const buildAssessmentPrompt = (
  patientProfile: PatientProfile,
  trialCriteria: { inclusion: string[]; exclusion: string[] }
): string => {
  const patientJson = JSON.stringify(patientProfile, null, 2);
  const criteriaJson = JSON.stringify(trialCriteria, null, 2);
  
  return `${assessTrialFitPrompt}\n\nPatient:\n${patientJson}\n\nTrial Criteria:\n${criteriaJson}`;
};
