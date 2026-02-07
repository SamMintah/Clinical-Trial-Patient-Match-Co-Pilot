// AI execution layer using Vercel AI SDK
// Purpose: Execute prompts with error handling, retries, and timeouts

import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { buildExtractionPrompt } from './prompts/extractPatientProfile';
import { buildAssessmentPrompt } from './prompts/assessTrialFit';
import { buildMockTrialsPrompt } from './prompts/generateMockTrials';
import { 
  validatePatientProfile, 
  validateMockTrials, 
  sanitizePatientProfile, 
  sanitizeMockTrials 
} from './validation';
import {
  extractWithClinicalBERT,
  assessWithMedAlpaca,
  generateWithFlanT5,
  isHuggingFaceAvailable,
} from './medicalModels';
import type { PatientProfile, TrialCriteria, MatchResult, MockTrial } from '@/types';

const AI_TIMEOUT_MS = 10000; // 10 second timeout
const MODEL = openai('gpt-4o-mini');

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
    return JSON.parse(text) as T;
  } catch (error) {
    console.error('JSON parse failed on first attempt:', error);
    
    if (retryPrompt) {
      try {
        const retryResponse = await Promise.race([
          generateText({
            model: MODEL,
            prompt: `${retryPrompt}\n\nReturn valid JSON only. No markdown, no explanations.`,
          }),
          createTimeout(AI_TIMEOUT_MS),
        ]);
        
        return JSON.parse(retryResponse.text) as T;
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
 * Uses Hugging Face Clinical-BERT if available, falls back to OpenAI
 * @param freeText - Raw clinical notes or patient description
 * @returns Structured PatientProfile object with validation applied
 */
export const extractPatient = async (freeText: string): Promise<PatientProfile> => {
  const prompt = buildExtractionPrompt(freeText);
  
  try {
    let parsed: PatientProfile | null = null;
    let modelUsed = 'OpenAI GPT-4o-mini';

    // Try Hugging Face Clinical-BERT first if API key available
    if (isHuggingFaceAvailable()) {
      console.log('Attempting extraction with Clinical-BERT...');
      const hfResult = await extractWithClinicalBERT(freeText);
      
      if (hfResult.success && hfResult.data) {
        try {
          parsed = JSON.parse(hfResult.data as string) as PatientProfile;
          modelUsed = hfResult.model;
          console.log('✓ Clinical-BERT extraction successful');
        } catch (parseError) {
          console.warn('Clinical-BERT returned invalid JSON, falling back to OpenAI');
        }
      } else {
        console.warn('Clinical-BERT failed:', hfResult.error);
      }
    }

    // Fallback to OpenAI if Hugging Face failed or unavailable
    if (!parsed) {
      console.log('Using OpenAI for extraction...');
      const response = await Promise.race([
        generateText({
          model: MODEL,
          prompt,
        }),
        createTimeout(AI_TIMEOUT_MS),
      ]);
      
      parsed = await safeJsonParse<PatientProfile>(response.text, prompt);
    }
    
    if (parsed) {
      // Sanitize AI output (fix common errors)
      const sanitized = sanitizePatientProfile(parsed);
      
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

      console.log(`Model used for extraction: ${modelUsed}`);
      
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
 * Uses Hugging Face MedAlpaca if available, falls back to OpenAI
 * @param patient - Structured patient profile
 * @param trial - Trial inclusion/exclusion criteria
 * @returns Match result with score, explanations, and recommendations
 */
export const assessTrial = async (
  patient: PatientProfile,
  trial: TrialCriteria
): Promise<MatchResult> => {
  const prompt = buildAssessmentPrompt(patient, trial);
  
  try {
    let parsed: MatchResult | null = null;
    let modelUsed = 'OpenAI GPT-4o-mini';

    // Try Hugging Face MedAlpaca first if API key available
    if (isHuggingFaceAvailable()) {
      console.log('Attempting assessment with MedAlpaca...');
      const patientJson = JSON.stringify(patient, null, 2);
      const criteriaJson = JSON.stringify(trial, null, 2);
      
      const hfResult = await assessWithMedAlpaca(patientJson, criteriaJson);
      
      if (hfResult.success && hfResult.data) {
        try {
          parsed = JSON.parse(hfResult.data as string) as MatchResult;
          modelUsed = hfResult.model;
          console.log('✓ MedAlpaca assessment successful');
        } catch (parseError) {
          console.warn('MedAlpaca returned invalid JSON, falling back to OpenAI');
        }
      } else {
        console.warn('MedAlpaca failed:', hfResult.error);
      }
    }

    // Fallback to OpenAI if Hugging Face failed or unavailable
    if (!parsed) {
      console.log('Using OpenAI for assessment...');
      const response = await Promise.race([
        generateText({
          model: MODEL,
          prompt,
        }),
        createTimeout(AI_TIMEOUT_MS),
      ]);
      
      parsed = await safeJsonParse<MatchResult>(response.text, prompt);
    }
    
    if (parsed) {
      console.log(`Model used for assessment: ${modelUsed}`);
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
 * Generates 3 mock clinical trials for demo purposes
 * Uses Hugging Face Flan-T5 if available, falls back to OpenAI
 * @param patientText - Patient description for context
 * @returns Array of 3 MockTrial objects (perfect match, excluded, uncertain) with validation applied
 */
export const generateTrials = async (patientText: string): Promise<MockTrial[]> => {
  const prompt = buildMockTrialsPrompt(patientText);
  
  try {
    let parsed: MockTrial[] | null = null;
    let modelUsed = 'OpenAI GPT-4o-mini';

    // Try Hugging Face Flan-T5 first if API key available
    if (isHuggingFaceAvailable()) {
      console.log('Attempting trial generation with Flan-T5...');
      const hfResult = await generateWithFlanT5(patientText);
      
      if (hfResult.success && hfResult.data) {
        try {
          const parsedData = JSON.parse(hfResult.data as string);
          if (Array.isArray(parsedData)) {
            parsed = parsedData as MockTrial[];
            modelUsed = hfResult.model;
            console.log('✓ Flan-T5 generation successful');
          }
        } catch (parseError) {
          console.warn('Flan-T5 returned invalid JSON, falling back to OpenAI');
        }
      } else {
        console.warn('Flan-T5 failed:', hfResult.error);
      }
    }

    // Fallback to OpenAI if Hugging Face failed or unavailable
    if (!parsed) {
      console.log('Using OpenAI for trial generation...');
      const response = await Promise.race([
        generateText({
          model: MODEL,
          prompt,
        }),
        createTimeout(AI_TIMEOUT_MS),
      ]);
      
      parsed = await safeJsonParse<MockTrial[]>(response.text, prompt);
    }
    
    if (parsed && Array.isArray(parsed)) {
      // Sanitize AI output (fix common errors)
      const sanitized = sanitizeMockTrials(parsed);
      
      // Validate sanitized trials
      const validation = validateMockTrials(sanitized);
      
      if (!validation.isValid) {
        console.error('Mock trials validation failed:', validation.errors);
        validation.errors.forEach(err => console.error(`  - ${err}`));
        // Use fallback if validation fails critically
        return getFallbackTrials();
      }
      
      if (validation.warnings.length > 0) {
        console.warn('Mock trials warnings:', validation.warnings);
        validation.warnings.forEach(warn => console.warn(`  - ${warn}`));
      }

      console.log(`Model used for trial generation: ${modelUsed}`);
      
      return sanitized;
    }
    
    // Fallback: return hardcoded demo trials
    console.error('Failed to generate trials, returning fallback');
    return getFallbackTrials();
  } catch (error) {
    console.error('generateTrials failed:', error);
    return getFallbackTrials();
  }
};

/**
 * Hardcoded fallback trials for demo reliability
 */
const getFallbackTrials = (): MockTrial[] => [
  {
    nctId: 'NCT05123456',
    title: 'Study of Trastuzumab Deruxtecan in HER2+ Breast Cancer After Prior Therapy',
    phase: 'Phase 3',
    briefSummary: 'Evaluates trastuzumab deruxtecan in patients with HER2-positive breast cancer who progressed on prior anti-HER2 therapy. Primary endpoint is progression-free survival.',
    inclusionCriteria: [
      'Age 18 years or older',
      'HER2-positive breast cancer (IHC 3+ or FISH+)',
      'Stage III or IV disease',
      'Prior trastuzumab allowed and progression documented',
      'ECOG performance status 0-2',
    ],
    exclusionCriteria: [
      'Active brain metastases requiring immediate treatment',
      'LVEF <50%',
      'Uncontrolled intercurrent illness',
    ],
    matchType: 'perfect',
    matchScore: 92,
  },
  {
    nctId: 'NCT05234567',
    title: 'First-Line Tucatinib Plus Trastuzumab in Treatment-Naive HER2+ Breast Cancer',
    phase: 'Phase 2',
    briefSummary: 'Investigates tucatinib combination therapy in treatment-naive HER2-positive breast cancer patients. Requires no prior systemic anti-HER2 therapy.',
    inclusionCriteria: [
      'Age 18-75 years',
      'HER2-positive breast cancer',
      'Stage II-IV disease',
      'No prior systemic therapy for breast cancer',
      'ECOG performance status 0-1',
    ],
    exclusionCriteria: [
      'Prior anti-HER2 therapy (trastuzumab, pertuzumab, etc.)',
      'Prior chemotherapy for breast cancer',
      'Cardiac dysfunction',
    ],
    matchType: 'excluded',
    matchScore: 20,
  },
  {
    nctId: 'NCT05345678',
    title: 'Neratinib Maintenance Therapy in High-Risk HER2+ Breast Cancer',
    phase: 'Phase 3',
    briefSummary: 'Studies neratinib as maintenance therapy after standard treatment in high-risk HER2-positive breast cancer. Requires excellent performance status.',
    inclusionCriteria: [
      'Age 18-70 years',
      'HER2-positive breast cancer',
      'Stage III disease',
      'Completed prior trastuzumab-based therapy',
      'ECOG performance status 0 (fully active)',
    ],
    exclusionCriteria: [
      'Metastatic disease',
      'Severe diarrhea or GI disorders',
      'Inadequate organ function',
    ],
    matchType: 'uncertain',
    matchScore: 62,
  },
];
