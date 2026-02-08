// Prompt: Extract structured patient data from free-text clinical notes
// Purpose: Parse messy clinician input into standardized fields for trial matching

export const extractPatientProfilePrompt = `Extract patient data as raw JSON (no markdown, no code blocks, no backticks) with these exact fields: age (number), gender (string: male/female/other/unknown), conditions (array of strings), medications (array of strings), allergies (array of strings), biomarkers (object with string keys and values), stage (string or null), priorTreatments (array of strings), performanceStatus (string or null), labValues (object with string keys and values). Use null or empty array for missing data. Return ONLY valid JSON. Do not include any text before or after. Use double quotes for all keys and string values. No trailing commas. Start response with { and end with }.

Input:`;

export const buildExtractionPrompt = (freeText: string): string => `${extractPatientProfilePrompt}\n\n"${freeText}"`;
