// AI execution layer using Vercel AI SDK
// Purpose: Execute prompts with error handling, retries, and timeouts

import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { buildExtractionPrompt } from './prompts/extractPatientProfile';
import { buildAssessmentPrompt } from './prompts/assessTrialFit';
import { 
  validatePatientProfile, 
  validateMockTrials, 
  sanitizePatientProfile,
} from './validation';
import type { PatientProfile, TrialCriteria, MatchResult, MockTrial } from '@/types';

const AI_TIMEOUT_MS = 10000; // 10 second timeout

/**
 * Creates a timeout promise that rejects after specified milliseconds
 */
const createTimeout = (ms: number): Promise<never> => 
  new Promise((_, reject) => {
    setTimeout(() => reject(new Error('AI request timeout')), ms);
  });

/**
 * Safely parses JSON with retry logic
 * @param text - Raw text response from AI
 * @param retryPrompt - Prompt to use if initial parse fails
 * @returns Parsed object or null if parsing fails
 */
const safeJsonParse = async <T>(
  text: string,
  retryPrompt?: string
): Promise<T | null> => {
  try {
    // Strip markdown code blocks if present
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    
    return JSON.parse(cleanText) as T;
  } catch (error) {
    console.error('JSON parse failed on first attempt:', error);
    
    if (retryPrompt) {
      try {
        const retryResponse = await Promise.race([
          generateText({
            model: groq('llama-3.3-70b-versatile'),
            prompt: `${retryPrompt}\n\nReturn ONLY valid JSON. No markdown code blocks, no backticks, no explanations. Just the raw JSON object.`,
            maxRetries: 0,
          }),
          createTimeout(AI_TIMEOUT_MS),
        ]);
        
        // Strip markdown code blocks from retry response too
        let cleanRetryText = retryResponse.text.trim();
        if (cleanRetryText.startsWith('```json')) {
          cleanRetryText = cleanRetryText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
        } else if (cleanRetryText.startsWith('```')) {
          cleanRetryText = cleanRetryText.replace(/^```\s*/, '').replace(/```\s*$/, '');
        }
        
        return JSON.parse(cleanRetryText) as T;
      } catch (retryError) {
        console.error('JSON parse failed on retry:', retryError);
        return null;
      }
    }
    
    return null;
  }
};

/**
 * Extracts structured patient profile from free-text clinical notes
 * Uses Groq llama-3.3-70b for fast, reliable extraction
 * @param freeText - Raw clinical notes or patient description
 * @returns Structured PatientProfile object with validation applied
 */
export const extractPatient = async (freeText: string): Promise<PatientProfile> => {
  const prompt = buildExtractionPrompt(freeText);
  
  try {
    console.log('Using Groq for patient extraction...');
    
    const response = await Promise.race([
      generateText({
        model: groq('llama-3.3-70b-versatile'),
        prompt,
        maxRetries: 2,
      }),
      createTimeout(AI_TIMEOUT_MS),
    ]);
    
    const parsed = await safeJsonParse<PatientProfile>(response.text, prompt);
    
    if (parsed) {
      // Sanitize AI output (fix common errors)
      const sanitized = sanitizePatientProfile(parsed, freeText);
      
      // Validate sanitized profile
      const validation = validatePatientProfile(sanitized);
      
      if (!validation.isValid) {
        console.error('Patient profile validation failed:', validation.errors);
        validation.errors.forEach(err => console.error(`  - ${err}`));
      }
      
      if (validation.warnings.length > 0) {
        console.warn('Patient profile warnings:', validation.warnings);
        validation.warnings.forEach(warn => console.warn(`  - ${warn}`));
      }

      console.log('✓ Groq extraction successful');
      
      return sanitized;
    }
    
    // Fallback: return empty profile
    console.error('Failed to parse patient profile, returning fallback');
    return {
      age: 0,
      gender: 'unknown',
      conditions: [],
      medications: [],
      allergies: [],
      biomarkers: {},
      stage: null,
      priorTreatments: [],
      performanceStatus: null,
      labValues: {},
    };
  } catch (error) {
    console.error('extractPatient failed:', error);
    return {
      age: 0,
      gender: 'unknown',
      conditions: [],
      medications: [],
      allergies: [],
      biomarkers: {},
      stage: null,
      priorTreatments: [],
      performanceStatus: null,
      labValues: {},
    };
  }
};

/**
 * Assesses how well a patient fits a clinical trial's eligibility criteria
 * Uses MedAlpaca (medical AI) if available, falls back to Groq
 * Applies medical guardrails to override AI when clinical logic is clear
 * @param patient - Structured patient profile
 * @param trial - Trial with inclusion/exclusion criteria
 * @returns Match result with score, explanations, and recommendations
 */
export const assessTrial = async (
  patient: PatientProfile,
  trial: MockTrial
): Promise<MatchResult> => {
  const trialCriteria: TrialCriteria = {
    inclusion: trial.inclusionCriteria,
    exclusion: trial.exclusionCriteria,
  };
  
  const prompt = buildAssessmentPrompt(patient, trialCriteria);
  
  try {
    console.log('Using Groq for assessment...');
    const response = await Promise.race([
      generateText({
        model: groq('llama-3.3-70b-versatile'),
        prompt,
        maxRetries: 2,
      }),
      createTimeout(AI_TIMEOUT_MS),
    ]);
    
    const parsed = await safeJsonParse<MatchResult>(response.text, prompt);
    
    if (parsed) {
      // Apply medical guardrails to validate/override AI assessment
      const { applyMedicalGuardrails } = await import('./validation');
      const guardrailResult = applyMedicalGuardrails(patient, trial, parsed);
      
      // Log guardrail findings
      if (guardrailResult.flags.length > 0) {
        console.log('🛡️ Medical guardrails detected issues:');
        guardrailResult.flags.forEach(flag => console.log(`  - ${flag}`));
      }
      
      // Override AI assessment if guardrails triggered
      if (guardrailResult.shouldOverride) {
        console.log(`⚠️ Guardrail override: Score ${parsed.matchScore} → ${guardrailResult.overrideScore}`);
        
        return {
          matchScore: guardrailResult.overrideScore!,
          confidenceLevel: 'high', // Guardrails are deterministic, so high confidence
          inclusionMatches: parsed.inclusionMatches,
          exclusionFlags: [...parsed.exclusionFlags, ...guardrailResult.flags],
          uncertainFactors: parsed.uncertainFactors,
          explanation: guardrailResult.reasoning,
          questionsToAsk: parsed.questionsToAsk,
        };
      }
      
      // Add guardrail flags to AI assessment even if not overriding
      if (guardrailResult.flags.length > 0) {
        parsed.exclusionFlags = [...parsed.exclusionFlags, ...guardrailResult.flags];
      }
      
      console.log('✓ Assessment complete using: Groq llama-3.3-70b + Medical Guardrails');
      return parsed;
    }
    
    // Fallback: return low-confidence uncertain match
    console.error('Failed to parse match result, returning fallback');
    return {
      matchScore: 0,
      confidenceLevel: 'low',
      inclusionMatches: [],
      exclusionFlags: ['Unable to assess criteria due to processing error'],
      uncertainFactors: ['All criteria require manual review'],
      explanation: 'Assessment failed. Please review trial criteria manually.',
      questionsToAsk: ['Verify all eligibility criteria with trial coordinator'],
    };
  } catch (error) {
    console.error('assessTrial failed:', error);
    return {
      matchScore: 0,
      confidenceLevel: 'low',
      inclusionMatches: [],
      exclusionFlags: ['Unable to assess criteria due to processing error'],
      uncertainFactors: ['All criteria require manual review'],
      explanation: 'Assessment failed. Please review trial criteria manually.',
      questionsToAsk: ['Verify all eligibility criteria with trial coordinator'],
    };
  }
};

/**
 * Gets real clinical trials from ClinicalTrials.gov database
 * Filters trials by patient's cancer type for relevance
 * @param patient - Patient profile with conditions
 * @returns Array of relevant clinical trials (up to 8)
 */
export const generateTrials = async (patient: PatientProfile): Promise<MockTrial[]> => {
  try {
    console.log('Fetching real clinical trials from database...');
    
    // Get trials filtered by patient's cancer type
    const { getTrialsForPatient, getTrialStats } = await import('@/data/clinicalTrials');
    const relevantTrials = getTrialsForPatient(patient);
    
    // Log trial statistics
    const stats = getTrialStats();
    console.log('Trial database stats:', stats);
    
    // Validate trials
    const validation = validateMockTrials(relevantTrials.slice(0, 3)); // Validate first 3 for demo
    
    if (!validation.isValid) {
      console.error('Trials validation failed:', validation.errors);
      validation.errors.forEach(err => console.error(`  - ${err}`));
    }
    
    if (validation.warnings.length > 0) {
      console.warn('Trials warnings:', validation.warnings);
      validation.warnings.forEach(warn => console.warn(`  - ${warn}`));
    }

    console.log('✓ Real clinical trials loaded from ClinicalTrials.gov');
    console.log(`Trials: ${relevantTrials.map(t => t.nctId).join(', ')}`);
    
    return relevantTrials;
  } catch (error) {
    console.error('Failed to load real trials:', error);
    // Fallback to random trials if something goes wrong
    const { getRandomTrials } = await import('@/data/clinicalTrials');
    return getRandomTrials(8);
  }
};
